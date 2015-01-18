
// Съхранява всички регистрирани потребители и данни за самите тях.
// 
var userSchema = new Schema({
    username: String,
    password: String,
    passphrase: String,
    email: String,
    avatar: String,
    firstName: String,
    lastName: String,
    description: String,
    privateKey: String,
    publicKey: String,
    created: { type: Date, default: Date.now }
});

// Съдържа "приятелствата" в системата
// userId, firendId са референции към колекцията с потребителите
var friendSchema = new Schema({
    userId: Schema.ObjectId,
    friendId: Schema.ObjectId,
    username: String,
    isAccepted: Boolean, 
    isPending: Boolean,
    created: { type: Date, default: Date.now }
});

// Съдържа създадените стаи за чатове
// participants е списък с референции към колекцията на потребителите. Тук се държат всички участници в даден чат
var roomSchema = new Schema({
    title: String,
    participants: [Schema.Types.ObjectId],
    created: { type: Date, default: Date.now }
});

// Съдържа съобщенията между потребителите
// roomId и userId са референции съответнокъм колекцията със стаи и с потребители
var messageSchema = new Schema({
    roomId: Schema.ObjectId,
    user: Schema.ObjectId,
    username: String,
    content: String,
    date: { type: Date, default: Date.now },
    isCrypted: Boolean,
});

// Съдържа постове и мнения на потребители, нещо като стена със статуси
// userId представлява референция към колекцията на потребителите
var postSchema = new Schema({
    userId: Schema.ObjectId,
    message: String,
    date: { type: Date, default: Date.now },
    isCrypted: Boolean,
});

