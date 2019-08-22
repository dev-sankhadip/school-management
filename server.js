var mysql=require('mysql');
var express=require('express');
var bodyparser=require('body-parser');
var formidable=require('formidable');
var fs=require('fs');
var socket=require('socket.io');
var app=express();
var cookieparser=require('cookie-parser');
const nodemailer=require('nodemailer');
app.use(cookieparser());
app.set('view engine','ejs');
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static('public'));
var server=app.listen(2000, function()
{
    console.log('connected to port 2000');
})

var connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    database:'sankha'
});

app.get('/', function(request, response)
{
    response.sendfile('index.html');
});

var roll;
var leave_id;
var picid;
var io=socket(server);
io.on('connection', function(socket)
{
	console.log('a user connected');
    socket.on('id', function(data)
    {
        roll=data.id;
    })
    socket.on('leave', function(message)
    {
        leave_id=message.id;
        console.log(leave_id);
    })
    socket.on('picid', function(data)
    {
        picid=data.picid
    })
})

///change profile pic of teacher and student
app.post('/changeprofilepic', function(request, response)
{
    var form=new formidable.IncomingForm();
    form.parse(request, function(err, fields, files)
    {
        var oldpath=files.fileupload.path;
        var newpath='C:/Users/SANKHADIP SAMANTA/Desktop/public/'+files.fileupload.name;
        fs.rename(oldpath, newpath, function(err)
        {
            if(err) throw err;
            console.log('uploaded and moved');
            var path=files.fileupload.name;
            console.log(picid)
            var sql="update name set image= ? where id = ?";
            connection.query(sql,[path, picid], function(err, result)
            {
                if(err)
                {
                    throw err;
                }
                console.log('profile picture uploaded');
            })
            response.end('file uploaded and moved');
        });
    });
})
//add user
app.post('/adduser', function(request, response)
{
        var username=request.body.username;
        var useremail=request.body.useremail;
        var userid=request.body.userid;
        var usercategory=request.body.usercategory;
        var userbatch=request.body.userbatch;
        var usernumber=request.body.usernumber;
        var parentname=request.body.parentname;
        var parentnumber=request.body.parentnumber;
        var userpassword=request.body.userpassword;
        var value=[[request.body.uname, request.body.password, request.body.email]];
        var uname=request.body.uname;
        var email=request.body.email;
        var password=request.body.email;
        var sql="insert into name(name,id,email,category, batch, mobile, parent, mobile2, password) values (?,?,?,?,?,?,?,?,?)";
        connection.query(sql,[username, userid, useremail, usercategory, userbatch, usernumber, parentname, parentnumber, userpassword], function(err, result)
        {
            if(err)
            {
                throw err;
            }
            console.log('1 record inserted');
            response.end('you have successfully updated database');
        })
})

///hadle login route
var clone;
var clone1;
var clone2;
app.post('/login', function(request, response)
{
    console.log(request.body);
    response.cookie('email',request.body.email, { maxAge: 9000000, httpOnly: true });
    console.log('connected!');
    var value=[[request.body.uname,request.body.pass]];
    var email=request.body.email;
    var password=request.body.password;
    var sql="select * from name where email = ? and password= ?";
    connection.query(sql,[email, password],function(err, result)
    {
        if(result.length>0)
        {
            if(result[0].password==password)
            {
                if(result[0].category=='teacher')
                {
                    //var data={age:29, job:'developer', hobby:['eating','swiming','enjoying']};
                    var info={name:result[0].name, email:result[0].email, category:result[0].category, id:result[0].id, batch:result[0].batch, mobile:result[0].mobile, image:result[0].image};
                    response.render('teacher',{info});
                }
                else if(result[0].category=='parent')
                {
                    var data={name:result[0].name, email:result[0].email, category:result[0].category, id:result[0].id, batch:result[0].batch, mobile:result[0].mobile, parent:result[0].parent, mobile2:result[0].mobile2, image:result[0].image, resource:result[0].resource, resource_name:result[0].resource_name, mark:result[0].marks ,attendence:result[0].attendence};
                    clone=data;
                    clone2=data;
                    response.render('student',{data});
                }
                else if(result[0].category=='admin')
                {
                    var sql1="select * from holiday";
                    connection.query(sql1, function(err, result1)
                    {
                        console.log(result);
                        console.log(result1);
                        var data={name:result[0].name, email:result[0].email, category:result[0].category, id:result[0].id, mobile:result[0].mobile,image:result[0].image};
                        response.render('admin',{data:data, holiday:result1});
                    })
                }
            }
            else
            {
                response.send('does not exist');
            }
        }
        else
        {
            response.send('invalid username or password');
        }
    })
});


//hadle login get request
app.get('/login', function(request, response)
{
    if(request.cookies.email)
    {
        var email=request.cookies.email;
        var sql="select * from name where email=?";
        connection.query(sql,[email], function(err, result)
        {
            if(result[0].category=='parent')
            {
                var data={name:result[0].name, email:result[0].email, category:result[0].category, id:result[0].id, batch:result[0].batch, mobile:result[0].mobile, parent:result[0].parent, mobile2:result[0].mobile2, image:result[0].image, resource:result[0].resource, resource_name:result[0].resource_name, mark:result[0].marks ,attendence:result[0].attendence};
                response.render('student',{data});
            }
            else if(result[0].category=='teacher')
            {
                var info={name:result[0].name, email:result[0].email, category:result[0].category, id:result[0].id, batch:result[0].batch, mobile:result[0].mobile, image:result[0].image};
                response.render('teacher',{info});
            }
            else if(result[0].category=='admin')
            {
                var sql1="select * from holiday";
                connection.query(sql1, function(err, result1)
                {
                    console.log(result);
                    console.log(result1);
                    var data={name:result[0].name, email:result[0].email, category:result[0].category, id:result[0].id, mobile:result[0].mobile,image:result[0].image};
                    response.render('admin',{data:data, holiday:result1});
                })
            }
        })
    }
    else
    {
        response.end('session expired!!!  Login first');
    }
})

//handle logout request
app.get('/logout',function(request, response)
{
    response.clearCookie('email');
    setTimeout(function()
    {
        response.redirect('/');
    },3000);
})
app.post('/login/uploaded', function(request, response)
{
    var form=new formidable.IncomingForm();
    form.parse(request, function(err, fields, files)
    {
        var oldpath=files.resource.path;
        var newpath='C:/Users/SANKHADIP SAMANTA/Desktop/public/'+files.resource.name;
        fs.rename(oldpath, newpath, function(err)
        {
            if(err) throw err;
            response.write('file uploded and moved');
            console.log('uploaded and moved');
            var path=files.resource.name;
            var name=files.resource.name+' download this.';
            var value=[[path]];
            var sql="update name set resource= ? , resource_name = ?";
            connection.query(sql,[path, name], function(err, result)
            {
                if(err)
                {
                    throw err;
                }
                console.log('resource uploaded');
            })
            response.end();
        });
    });
})


//handle resource download
app.get('/login/downloaded', function(request, response)
{
    var file=__dirname+'/public/'+clone.resource;
    response.download(file);
})

//upload marks
app.post('/login/mark',function(request, response)
{
        var id=request.body.id;
        var number=request.body.number;
        var sql="update name set marks= ? where id = ?";
        connection.query(sql,[number,id], function(err, result)
        {
            if(err)
            {
                throw err;
            }
            console.log('marks uploaded');
        })
        response.end('marks uploaded');
})

//upload attendence
app.post('/login/attendence', function(request, response)
{
    var id=request.body.id;
    var attendence=request.body.attendence;
    var sql="update name set attendence = ? where id= ?";
    connection.query(sql,[attendence,id], function(err, result)
    {
        if(err)
        {
            throw err;
        }
        console.log('attendence uploaded');
    })
    response.end('attendence uploaded');
})

//apply login
app.post('/login/leave',function(request, response)
{
    var value=[[request.body.from_date, request.body.to_date, request.body.reason, leave_id]];
    var sql="insert into holiday(start,end,why,id) values ?";
    connection.query(sql,[value],function(err, result)
    {
        if(err)
        {
            throw err;
        }
        console.log('request accepted');
    })
    response.end('leave request has been sent to Admin');
})

//approve leave
app.get('/approveleave', function(request, response)
{
    
})


//update gallery of school
app.post('/updategallery', function(request, response)
{
    var form=new formidable.IncomingForm();
    form.parse(request, function(err, fields, files)
    {
        var oldpath=files.fileupload.path;
        var newpath='C:/Users/SANKHADIP SAMANTA/Desktop/public/'+files.fileupload.name;
        fs.rename(oldpath, newpath, function(err)
        {
            if(err) throw err;
            response.write('file uploded and moved');
            var path=files.fileupload.name;
            var value=[[path]];
            var sql="insert into gallery(image) values ?";
            connection.query(sql,[value], function(err, result)
            {
                if(err)
                {
                    throw err;
                }
                console.log('photos uploaded');
            })
            response.end();
        });
    });
})

//view gallery request
app.get('/seegallery', function(request, response)
{
    if(request.cookies.email)
    {
        var sql="select image from gallery";
        connection.query(sql,function(err, result)
        {
            if(err)
            {
                throw err;
            }
            var data={image:result}
            var image=data.image;
            response.render('gallery',{image});
        })
    }
    else
    {
        response.end('session expired!!!  Login first');
    }
})

//password reset request
app.get('/resetpassword', function(request, response)
{
    response.sendfile('reset.html');
})

//after password reset
app.post('/passwordreset', function(request, response)
{
    var email=request.body.email;
    var password=request.body.password;
    var sql="update name set password=? where email=?";
    connection.query(sql,[password,email], function(err, result)
    {
        if(err)
        {
            throw err;
        }
        console.log('password reset');
        response.redirect('/');
    })
})




app.use(bodyparser.json());
//static folder
app.get('/message', function(request, response)
{
    response.render('contact');
});
app.post('/send', function(request, response)
{
    const output=`
    <p>Parents have some concern</p>
    <h3>Contact Details</h3>
    <ul>
        <li>Name:${request.body.name}</li>
        <li>Company:${request.body.company}</li>
        <li>Email: ${request.body.email}</li>
        <li>Phone:${request.body.phone}</li>
    </ul>
    <h3>Message</h3>
    <p>${request.body.message}</p>
    `;
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        service:'gmail',
        port: 587,
        //secure: false, // true for 465, false for other ports
        auth: {
            user: 'sankhadip.2000@gmail.com', // generated ethereal user
            pass: '9736594950'  // generated ethereal password
        }
        /*tls:{
          rejectUnauthorized:false
        }*/
      });
    
      // setup email data with unicode symbols
      let mailOptions = {
          from: '"Message" <sankhadip.2000@gmail.com>', // sender address
          to: 'samantaraja627@gmail.com', // list of receivers
          subject: 'Message from parents', // Subject line
          text: 'Hello world?', // plain text body
          html: output // html body
      };
    
      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              return console.log(error);
          }
          console.log('Message sent: %s', info.messageId);   
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      });
      response.end('your query is sent to admin');
});
app.listen(3000, function()
{
    console.log('server started....');
});