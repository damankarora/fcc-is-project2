'use strict';

let db = require('../database/db');

module.exports = function (app) {
  
  app.route('/api/threads/:board')
  .get(async function (req, res){
    let board_name = req.params.board;

    try{
      let results = await db.getRecentThreads(board_name);
      return res.json(results);
    }catch(err){
      return res.status(503).json({err: 'Something went wrong.'})
    }
    
  })
  .post(async function (req, res) {
    let board_name = req.params.board;

    let { text, delete_password } = req.body;

    if(!text || !delete_password){
      return res.status(400).json({error: 'Required field(s) missing.'});
    }

    try{
      let result = await db.addMessage({text, delete_password}, board_name);
      return res.json({message: 'DONE', _id: result._id});
    }
    catch(err){
      return res.status(503).json({err: 'Something went wrong'})
    }
  })
  .delete(async function(req, res){
    let board_name = req.params.board;
    let { thread_id, delete_password } = req.body;

    if(!thread_id || !delete_password){
      return res.status(400).json({err: "Required field(s) missing"});
    }

    try{
      await db.deleteThread(thread_id, delete_password, board_name);
      return res.send("success");
    }catch(err){
      return res.status(403).send("incorrect password");
    }
  })
  .put(async function(req, res){
    let board_name = req.params.board;
    let { thread_id } = req.body;

    if(!thread_id){
      return res.status(400).json({err: "Required field(s) missing"});
    }

    try{
      await db.reportThread(thread_id, board_name);
      return res.send("success");
    }catch(err){
      return res.status(503).json({err: "Something went wrong"});
    }
  });
    
  app.route('/api/replies/:board')
  .get(async function (req, res){
    let board_name = req.params.board;
    let thread_id = req.query.thread_id;
    
    if(!thread_id){
      return res.status(400).json({err: "Thread id is missing"});
    }

    try{
      let result = await db.getSingleThread(thread_id, board_name);
      return res.json(result);
    }catch(err){
      return res.status(503).json({err: "Something went wrong"});
    }
  })
  .post(async function (req, res){
    let board_name = req.params.board;
    let { text, delete_password, thread_id } = req.body;

    if(!text || !delete_password || !thread_id){
      console.log(text, delete_password, thread_id);
      return res.status(400).json({err: "Required field(s) missing"})
    }

    try{
      let result = await db.addReply({text, delete_password, thread_id}, board_name);
      return res.status(200).json({message: "DONE", _id: result._id});
    }catch(err){
      return res.status(503).json({err: "Something went wrong!"})
    }
  })
  .delete(async function(req, res){
    let board_name = req.params.board;

    let { thread_id, reply_id, delete_password } = req.body;

    if(!thread_id || !reply_id || !delete_password){
      return res.status(400).json({err: "Required field(s) missing"});
    }

    try{
      await db.deleteReply(thread_id, reply_id, delete_password, board_name);
      return res.send("success");
    }catch(err){
      return res.status(503).json("Something went wrong.");
    }
  })
  .put(async function (req, res){
    let board_name = req.params.board;

    let {thread_id, reply_id} = req.body;

    if(!thread_id || !reply_id){
      return res.status(400).json({err: "Required field(s) missing"});
    }

    try{
      await db.reportReply(thread_id, reply_id, board_name);
      return res.send("success");
    }
    catch(err){
      return res.status(500).json({err: "Something went wrong."});
    }
  });

};
