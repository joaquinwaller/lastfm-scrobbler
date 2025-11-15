module.exports = class UserManager {

    constructor(mongo, lastFmManager) {
        this.mongo = mongo;
        this.lastFmManager = lastFmManager;
        this.registeringCache = new Map();
    }

    // Get collection
    getCollection() {
        return this.mongo.db('spotify-scrobbler').collection('users');
    }

    // Helper to execute database operations with automatic reconnection
    async executeWithReconnect(operation) {
        try {
            return await operation();
        } catch (error) {
            // If error is "Topology is closed", try to reconnect and retry once
            if (error.message && error.message.includes('Topology is closed')) {
                try {
                    console.log('⚠️ Database connection closed, attempting to reconnect...');
                    await this.mongo.connect();
                    console.log('✅ Reconnected to MongoDB');
                    // Retry the operation after reconnection
                    return await operation();
                } catch (reconnectError) {
                    throw new Error(`Database connection error: ${reconnectError.message}`);
                }
            }
            throw error;
        }
    }

    async registerUser(id) {
        if (this.registeringCache.has(id)) {
            throw new Error(`User ${id} is already registering!`);
        }

        const usersCollection = this.getCollection();
        const existingUser = await this.executeWithReconnect(async () => {
            return await usersCollection.findOne({_id: id});
        });
        if (existingUser !== null) {
            throw new Error(`User with id ${id} is already registered.`);
        }

        const user = {
            id: id,
            token: await this.lastFmManager.fetchLoginToken(),
            since: new Date()
        }

        this.registeringCache.set(
            id,
            user
        );

        return user;
    }

    async unregister(id) {
        const usersCollection = this.getCollection();
        const user = await this.executeWithReconnect(async () => {
            return await usersCollection.findOne({_id: id});
        });
        if (user == null) {
            throw new Error(`User with id ${id} is not registered.`);
        }

        console.log("fetched user", user);

        console.log("deleted count", await this.deleteUser(id));

        this.registeringCache.delete(id); // just in case
        return user;
    }

    async loginUser(id) {
        const registering = this.registeringCache.get(id);
        if (!registering) {
            throw new Error(`User with id ${id} have not started the process of registration.`);
        }

        this.registeringCache.delete(id);

        const session = await this.lastFmManager.fetchSession(registering.token);
        if (!session) {
            throw new Error(`User with id ${id} have not authorized the login token yet.`);
        }

        const user = {
            _id: id,
            name: session.userName,
            session: session.sessionKey
        }

        const usersCollection = this.getCollection();
        await this.executeWithReconnect(async () => {
            return await usersCollection.replaceOne(
                {
                    _id: id
                },
                user,
                {
                    upsert: true
                }
            );
        });

        return user;
    }

    async getUser(id) {
        const usersCollection = this.getCollection();
        let user = await this.executeWithReconnect(async () => {
            return await usersCollection.findOne({_id: id});
        });
        if (!user) {
            throw new Error(`User with id ${id} was not found.`);
        }

        return user;
    }

    async deleteUser(id) {
        const usersCollection = this.getCollection();
        const result = await this.executeWithReconnect(async () => {
            return await usersCollection.deleteOne({_id: id});
        });
        return result.deletedCount > 0;
    }
}