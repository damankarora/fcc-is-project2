const { expect } = require('chai');
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

    test('creating a message',async () => {        

        let result = await db.addMessage({ text: 'Hello', delete_password: '1234' }, bName);
        assert.equal(result.text, 'Hello');

    });


    suite('Adding reply', function (){
        let _id = null;
        this.beforeAll(async ()=>{
            let result = await db.addMessage({ text: 'Hello1', delete_password: '1234' }, bName)
            _id = result._id;
        })

        test('Adding reply to a thread', async ()=>{
            
            let result = await db.addReply({ text: 'Reply1', delete_password: '1234', thread_id: _id }, bName);
            assert.equal(result.text, 'Reply1');
            
        })
    })

    test('Getting recent threads', async ()=>{
        let results = await db.getRecentThreads(bName);
        assert.isArray(results)
        assert.isAtMost(results.length, 10)
        assert.isAtMost(results[0].replies.length, 3);
    })

    suite('Deleting a thread', function(){
        let _id = null;
        this.beforeAll(async ()=>{
            let results = await db.addMessage({ text: 'Hello1', delete_password: '1234' }, bName);
            _id = results._id;
        })

        test('Deleting thread with correct id',async ()=>{
            let result = await db.deleteThread(_id, '1234', bName);
            assert.equal(result, 'Done');
            
        })

        test('Deleting thread with wrong _id', (done)=>{
            db.deleteThread('wrongId', '1234', bName).then(()=>{
                fail('Promise resolved');
            }).catch((err)=>{
                assert.equal(err.message, 'Thread not found');
                done();
            })
            
        })
    });

    suite('Getting a single thread', function (){
        let _id = null;

        this.beforeAll(async () => {
            let results = await db.addMessage({ text: 'Hello1', delete_password: '1234' }, bName);
            _id = results._id;
        })


        test('When correct thread_id is given',async ()=>{
            let results = await db.getSingleThread(_id, bName);
            assert.deepEqual(results._id, _id);
        });

        test('When incorrect thread_id is given', (done)=>{
            db.getSingleThread('1234', bName)
            .then(()=>{
                fail('Promise resolved')
            })
            .catch((err)=>{                
                assert.deepEqual(err.message, 'Thread not found');                
                done();
            })
        })
    })

    suite('Deleting a reply', function (){
        let _id = null;
        let reply_id = null;

        this.beforeAll(async () => {
            let threadResults = await db.addMessage({ text: 'Hello1', delete_password: '1234' }, bName);
            _id = threadResults._id;            
            let replyResult = await db.addReply({ text: 'Reply1', delete_password: '1234', thread_id: _id }, bName);
            reply_id = replyResult._id;
        });

        test('When reply_id is wrong.', (done)=>{
            db.deleteReply(_id, 'wrongReplyId', '1234', bName).then(()=>{
                fail("Promise resolved");
            })
            .catch((err)=>{
                assert.deepEqual(err.message, 'Reply not found');
                done();
            })
        })

        test('When thread_id is wrong', (done)=>{
            db.deleteReply('wrongThreadId', reply_id, '1234', bName).then(() => {
                fail("Promise resolved");
            })
                .catch((err) => {
                    assert.deepEqual(err.message, 'Thread not found');
                    done();
                })
        })

        test('When both Ids are correct', async ()=>{
            let results = await db.deleteReply(_id, reply_id, '1234', bName)
            assert.equal(results, 'DONE');
        })
    });

    suite('Reporting threads', ()=>{
        let _id = null;
        

        this.beforeAll(async () => {
            let threadResults = await db.addMessage({ text: 'Hello1', delete_password: '1234' }, bName);
            _id = threadResults._id;
            
        });

        test('When incorrect thread_id is given', (done)=>{
            db.reportThread('incorrect', bName)
            .then(()=>{
                fail('Promise resolved')
            })
            .catch((err)=>{
                assert.deepEqual(err.message, 'Thread not found')
                done()
            })
        })

        test('When correct thread_id is given', async ()=>{
            let result = await db.reportThread(_id, bName);
            assert.equal(result, 'success');
        })
    })

    suite('Reporting threads', () => {
        let _id = null;
        let reply_id = null;

        this.beforeAll(async () => {
            let threadResults = await db.addMessage({ text: 'Hello1', delete_password: '1234' }, bName);
            _id = threadResults._id;
            let replyResult = await db.addReply({ text: 'Reply1', delete_password: '1234', thread_id: _id }, bName);
            reply_id = replyResult._id;
        });

        test('When incorrect thread_id is given', (done) => {
            db.reportReply('1234', reply_id, bName)
                .then(() => {
                    fail('Promise resolved')
                })
                .catch((err) => {
                    assert.deepEqual(err.message, 'Thread not found')
                    done();
                })
        })

        test('When incorrect reply_id is given', (done) => {
            db.reportReply(_id, '1234', bName)
                .then(() => {
                    fail('Promise resolved')
                })
                .catch((err) => {
                    assert.deepEqual(err.message, 'Reply not found');
                    done();
                })
        })

        test('When correct thread_id and report_id is given', async () => {
            let result = await db.reportReply(_id, reply_id, bName);
            assert.equal(result, 'success');
        })
    })



})