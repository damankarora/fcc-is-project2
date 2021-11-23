const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    suite('Adding new thread', function (){
        test('When all fields are present', (done)=>{
            chai.request(server)
                .post('/api/threads/pikachu')
                .send({
                    text: "Hello",
                    delete_password: "1234"
                })
                .end((err, res)=>{
                    assert.equal(res.status, 200);
                    assert.equal(res.body.message, "DONE")
                    assert.property(res.body, '_id');
                    done();
                })
        })

        test('When required fields are missing', (done)=>{
            chai.request(server)
                .post('/api/threads/pikachu')
                .send({
                    text: "Hello"
                })
                .end((err, res) => {
                    assert.equal(res.status, 400);
                    done();
                })
        })
    })

    suite('Adding replies', function(){
        let thread_id = null;
        this.beforeAll(function(done){
            chai.request(server)
                .post('/api/threads/pikachu')
                .send({
                    text: "Hello",
                    delete_password: "1234"                    
                })
                .end((err, res) => {
                    thread_id = res.body._id;
                    done();
                })
        });

        test('When all the fields are present', (done)=>{
            chai.request(server)
                .post('/api/replies/pikachu')
                .send({
                    text: "Hello reply",
                    delete_password: "1234",
                    thread_id: thread_id
                })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.equal(res.body.message, "DONE")
                    assert.property(res.body, '_id');
                    done();
                })
        })

        test('When required fields are missing', (done)=>{
            chai.request(server)
                .post('/api/replies/pikachu')
                .send({
                    text: "Hello",
                    delete_password: "1234"
                })
                .end((err, res) => {
                    assert.equal(res.status, 400);  
                    done();
                })
        })
    })

    suite('Viewing threads', function(){
        let thread_id = null;
        this.beforeAll((done)=>{            
            chai.request(server)
                .post('/api/threads/pikachu')
                .send({
                    text: "Hello",
                    delete_password: "1234"
                })
                .end((err, res) => {
                    thread_id = res.body._id;
                    chai.request(server)
                        .post('/api/replies/pikachu')
                        .send({
                            text: "Hello reply",
                            delete_password: "1234",
                            thread_id: thread_id
                        })
                        .end((err, res) => {
                            assert.equal(res.status, 200);
                            assert.equal(res.body.message, "DONE")
                            assert.property(res.body, '_id');
                            done();
                        })
                })
        });

        test('Viewing recent threads', (done)=>{
            chai.request(server)
            .get('/api/threads/pikachu')
            .end((err, res)=>{
                assert.equal(res.status, 200);
                assert.isArray(res.body);
                assert.isAtMost(res.body.length, 10);
                done();
            })
        });

        test('Viewing a single thread', (done)=>{
            chai.request(server)
                .get('/api/replies/pikachu')
                .query({
                    thread_id
                })
                .end((err, res) => {
                    assert.equal(res.status, 200);                    
                    assert.deepEqual(res.body._id, thread_id);
                    done();
                })
        });
        
    })

    suite('Deleting a thread',function (){
        let thread_id = null;
        this.beforeAll((done)=>{
            chai.request(server)
                .post('/api/threads/pikachu')
                .send({
                    text: "Hello",
                    delete_password: "1234"
                })
                .end((err, res) => {
                    thread_id = res.body._id;
                    done();
                })
        })
        

        test('Deleting with a incomplete parameters', (done)=>{
            chai.request(server)
                .delete('/api/threads/pikachu')
                .send({
                    thread_id                    
                })
                .end((err, res) => {
                    assert.equal(res.status, 400);
                   done();
                })
        })

        test('Deleting with incorrect password', (done)=>{
            chai.request(server)
                .delete('/api/threads/pikachu')
                .send({
                    thread_id,
                    delete_password: '12345'
                })
                .end((err, res) => {
                    assert.equal(res.status, 403);
                    assert.equal(res.text, 'incorrect password');
                    done();
                })
        })

        test('Deleting a thread with correct id and password', (done) => {
            chai.request(server)
                .delete('/api/threads/pikachu')
                .send({
                    thread_id,
                    delete_password: '1234'
                })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'success');
                    done();
                })
        })
    })

    suite('Deleting a reply',function (){
        let thread_id = null;
        let reply_id = null;

        this.beforeAll((done) => {
            chai.request(server)
                .post('/api/threads/pikachu')
                .send({
                    text: "Hello",
                    delete_password: "1234"
                })
                .end((err, res) => {
                    thread_id = res.body._id;
                    chai.request(server)
                        .post('/api/replies/pikachu')
                        .send({
                            text: "Hello reply",
                            delete_password: "1234",
                            thread_id: thread_id
                        })
                        .end((err, res) => {
                            assert.equal(res.status, 200);
                            assert.equal(res.body.message, "DONE")
                            assert.property(res.body, '_id');
                            reply_id = res.body._id;
                            done();
                        })
                })
        });

        test('Deleting with incorrect password', (done) => {
            chai.request(server)
                .delete('/api/replies/pikachu')
                .send({
                    thread_id,
                    reply_id,
                    delete_password: '12345'
                })
                .end((err, res) => {
                    assert.equal(res.status, 403);
                    assert.equal(res.text, 'incorrect password');
                    done();
                })
        })

        test('Deleting with correct password', (done) => {
            chai.request(server)
                .delete('/api/replies/pikachu')
                .send({
                    thread_id,
                    reply_id,
                    delete_password: '1234'
                })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'success');
                    done();
                })
        })
        
    })

    suite('Reporting a thread',function (){
        let thread_id = null;
        this.beforeAll((done) => {
            chai.request(server)
                .post('/api/threads/pikachu')
                .send({
                    text: "Hello",
                    delete_password: "1234"
                })
                .end((err, res) => {
                    thread_id = res.body._id;
                    done();                   
                })
        });

        test('Reporting incorrect thread_id', (done)=>{
            chai.request(server)
            .put('/api/threads/pikachu')
            .send({
                thread_id: 'incorrect_id'
            })
            .end((err, res)=>{
                assert.equal(res.status, 503);
                done();
            });
        })

        test('Reporting with missing data', (done)=>{
            chai.request(server)
                .put('/api/threads/pikachu')                
                .end((err, res) => {
                    assert.equal(res.status, 400);
                    assert.equal(res.body.err, "Required field(s) missing");
                    done();
                });
        })
        
        test('Reporting with valid thread_id', (done)=>{
            chai.request(server)
                .put('/api/threads/pikachu')
                .send({
                    thread_id
                })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'success');
                    done();
                });
        })
    })

    suite('Reporting a reply', function (){
        let thread_id = null;
        let reply_id = null;

        this.beforeAll((done) => {
            chai.request(server)
                .post('/api/threads/pikachu')
                .send({
                    text: "Hello",
                    delete_password: "1234"
                })
                .end((err, res) => {
                    thread_id = res.body._id;
                    chai.request(server)
                        .post('/api/replies/pikachu')
                        .send({
                            text: "Hello reply",
                            delete_password: "1234",
                            thread_id: thread_id
                        })
                        .end((err, res) => {
                            assert.equal(res.status, 200);
                            assert.equal(res.body.message, "DONE")
                            assert.property(res.body, '_id');
                            reply_id = res.body._id;
                            done();
                        })
                })
        });

        test('Reporting with missing field', (done)=>{
            chai.request(server)
                .put('/api/replies/pikachu')
                .end((err, res) => {
                    assert.equal(res.status, 400);
                    assert.equal(res.body.err, "Required field(s) missing");
                    done();
                });
        })

        test('Reporting with invalid id', (done)=>{
            chai.request(server)
                .put('/api/replies/pikachu')
                .send({
                    thread_id: 'incorrect_id',
                    reply_id: 'Invalid'                    
                })
                .end((err, res) => {
                    assert.equal(res.status, 503);
                    done();
                });
        });

        test('Reporting with valid id', (done)=>{
            chai.request(server)
                .put('/api/threads/pikachu')
                .send({
                    thread_id,
                    reply_id
                })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'success');
                    done();
                });
        })


    })

    
});
