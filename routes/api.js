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
      await db.addMessage({text, delete_password}, board_name);
      return res.json({message: 'DONE'});
    }
    catch(err){
      return res.status(503).json({err: 'Something went wrong'})
    }
  });
    
  app.route('/api/replies/:board');

};
