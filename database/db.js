const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const saltRounds = 3;

const replySchema = new mongoose.Schema({
    text: String,
    created_on: Date,    
    reported: Boolean,
    delete_password: String
})

const threadSchema = new mongoose.Schema({
    text: String,    
    created_on: Date,
    bumped_on: Date,
    reported: Boolean,
    delete_password: String,
    replies: [replySchema]
});



const boardSchema = new mongoose.Schema({
    board_name: String,
    threads: [threadSchema]
});

const Boards = mongoose.model("Boards", boardSchema);

async function connect(uri){
    try{
        await mongoose.connect(uri);
        console.log("Connection successful");
    }
    catch(err){
        console.log("Connection with database unsuccessful.")
        console.log(err);
    }
}


async function addMessage(dataToAdd, board){
    try{
        // { text, delete_password } 
        // add created_on, bumped_on, reported, 
        dataToAdd['created_on'] = new Date();
        dataToAdd['bumped_on'] = new Date();
        dataToAdd['reported'] = false;
        dataToAdd['replies'] = [];

        // Hashing password
        dataToAdd['delete_password'] = await bcrypt.hash(dataToAdd['delete_password'], saltRounds);

        // Adding message
        
        // find board 
        let foundBoard = await Boards.findOne({board_name: board})
        
        // If board does not exist, create it.
        if(!foundBoard){
            foundBoard = new Boards({
                board_name: board,
                threads: []
            });
        }

        foundBoard.threads.push(dataToAdd);
        
        await foundBoard.save();

        return foundBoard.threads[foundBoard.threads.length - 1];
    }
    catch(err){
        console.log("ERROR in adding message");
        console.log(err);
    }
}

async function addReply({text, delete_password, thread_id}, board){
    try{
        const ourBoard = await Boards.findOne({board_name: board});
        const ourThread = ourBoard.threads.id(thread_id);
        if(!ourThread){
            throw new Error("Thread does not exist")            
        }

        delete_password = await bcrypt.hash(delete_password, saltRounds);
        
        ourThread.bumped_on = new Date();
        ourThread.replies.push({
            text, delete_password, created_on: new Date()
        });

        await ourBoard.save();
        
    }
    catch(err){
        console.log("ERROR in adding reply");
        console.log(err);
    }
}


async function getRecentThreads(board){
    try{
        let results = Boards.findOne({board_name: board});
        results.threads.sort((a, b) => {
            const aDate = new Date(a.bumped_on);
            const bDate = new Date(b.bumped_on);

            if (aDate < bDate) return -1;
            if (aDate > bDate) return 1;
            return 0;
        });

        let ourThreads = results.threads.slice(0, 11);

        for(let i = 0 ; i < ourThreads.length; i++){
            ourThreads[i].replies.sort((a, b)=>{
                const aDate = new Date(a.created_on);
                const bDate = new Date(b.created_on);

                if (aDate < bDate) return -1;
                if (aDate > bDate) return 1;
                return 0;
            })

            ourThreads[i].replies = ourThreads[i].replies.slice(0, 3);
        }

        return ourThreads;        
    }
    catch(err){
        console.log("ERROR in fetching recent threads")
        console.log(err);
    }
}


async function getAllThreads(board){
    return await Boards.findOne({board_name: board});
}

module.exports = {
    addMessage,
    addReply,
    connect,
    getRecentThreads,
    getAllThreads
}