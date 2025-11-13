module.exports = class UserManager {

    constructor(mongo, lastFmManager) {
        this.usersCollection = mongo.db('spotify-scrobbler')
            .collection('users');
        this.lastFmManager = lastFmManager;
        this.registeringCache = new Map();
    }

    async registerUser(id) {
        if (this.registeringCache.has(id)) {
            throw new Error(`User ${id} is already registering!`);
        }

        if (await this.usersCollection.findOne({_id: id}) !== null) {
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
        const user = await this.usersCollection.findOne({_id: id});
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

        this.usersCollection.replaceOne(
            {
                _id: id
            },
            user,
            {
                upsert: true
            }
        );

        return user;
    }

    async getUser(id) {
        let user = await this.usersCollection.findOne({_id: id});
        if (!user) {
            throw new Error(`User with id ${id} was not found.`);
        }

        return user;
    }

    async deleteUser(id) {
        return await this.usersCollection.deleteOne({_id: id}).deletedCount > 0;
    }
}