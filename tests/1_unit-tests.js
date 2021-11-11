const chai = require('chai');
const assert = chai.assert;
require('dotenv').config();

// Importing Db stuff
const db = require('../database/db');

suite('Testing database methods', function (){

    let bName = 'pikachu'
    this.timeout(5000);
    this.beforeAll(async ()=>{
        await db.connect(process.env.MONGO);
    });

    test('creating a message', async () => {
        assert.doesNotThrow(async () => {
            let result = await db.addMessage({ text: 'Hello', delete_password: '1234' }, bName);
            assert.equal(result.text, 'Hello');
        });
    });


    suite('Adding reply', ()=>{
        let _id = null;
        this.beforeAll(async ()=>{
            let result = await db.addMessage({ text: 'Hello1', delete_password: '1234' }, bName)
            _id = result._id;
        })

        test('Adding reply to a thread', async ()=>{
            assert.doesNotThrow(async ()=>{
                await db.addReply({ text: 'Reply1', delete_password: '1234', thread_id: _id }, bName);
            })
        })
    })    

})