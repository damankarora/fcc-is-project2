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
        throw new Error(err)
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
        throw new Error(err);
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
        
        const ourReply = {
            text,
            delete_password, 
            created_on: new Date()
        }
        ourThread.bumped_on = new Date();
        ourThread.replies.push(ourReply);

        await ourBoard.save();
        return ourThread.replies[ourThread.replies.length - 1];
        
    }
    catch(err){
        console.log("ERROR in adding reply");
        throw new Error(err);
    }
}


async function getRecentThreads(board){
    try{
        let results = await Boards.findOne({board_name: board});
        results.threads.sort((a, b) => {
            const aDate = new Date(a.bumped_on);
            const bDate = new Date(b.bumped_on);

            if (aDate < bDate) return -1;
            if (aDate > bDate) return 1;
            return 0;
        });

        let ourThreads = results.threads.slice(0, 10);

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
        throw new Error(err);
    }
}

async function deleteThread(thread_id, password, board_name){
    try{
        let board = await Boards.findOne({ board_name });
        let thread = board.threads.id(thread_id);
        if(!thread){
            throw new Error('Thread not found');
        }
        let matched = await bcrypt.compare(password, thread.delete_password);

        if (matched) {
            thread.remove();
            board.save();
            return 'Done';
        }
        throw new Error('Incorrect password')
    }
    catch(err){
        console.log("Error while deleting thread");
        throw new Error(err.message);
    }
}

async function getSingleThread(thread_id, board_name){
    try{
        let board = await Boards.findOne({ board_name });
        let ourThread = board.threads.id(thread_id);

        if (!ourThread) {
            throw new Error('Thread not found');
        }
        
        return ourThread;
    }catch(err){
        console.log("Error in getting a single thread");
        throw new Error(err.message);
    }    
}

async function deleteReply(thread_id, reply_id, delete_password, board_name){
    try{
        let targetBoard = await Boards.findOne({ board_name });
        let targetThread = targetBoard.threads.id(thread_id);

        if (!targetThread) {
            throw new Error('Thread not found');
        }

        let targetReply = targetThread.replies.id(reply_id);

        if (!targetReply) {
            throw new Error('Reply not found');
        }

        let password_matched = await bcrypt.compare(delete_password, targetReply.delete_password);

        if (!password_matched) {
            throw new Error('Incorrect password');
        }

        targetReply.remove();

        await targetBoard.save();
        return 'DONE';
    } catch(err) {
        console.log("Error in getting a single thread");
        throw new Error(err.message);
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
    getAllThreads,
    deleteThread,
    getSingleThread,
    deleteReply
}