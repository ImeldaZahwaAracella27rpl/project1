const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const session = require('express-session')
const jwt = require('jsonwebtoken')

const app = express()
const port = 2000;

const secretKey = 'thisisverysecretkey'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

const db = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: "project1"
})

const isAuthorized = (request, result, next) => {
    // cek apakah user sudah mengirim header 'x-api-key'
    if (typeof(request.headers['x-api-key']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token is not provided'
        })
    }

    // get token dari header
    let token = request.headers['x-api-key']

    // melakukan verifikasi token yang dikirim user
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token is invalid'
            })
        }
    })

    // lanjut ke next request
    next()
}

// LOGIN ADMIN
app.post('/login/penjual', function(request, response) {
    let data = request.body
	var username = data.username;
	var password = data.password;
	if (username && password) {
		db.query('SELECT * FROM penjual WHERE username= ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = data.username;
				response.redirect('/login/admin');
			} else {
				response.send('Username dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Username and Password!');
		response.end();
	}
});


app.get('/login/penjual', function(request, results) {
	if (request.session.loggedin) {
        let data = request.body
        let token = jwt.sign(data.username + '|' + data.password, secretKey)

        results.json({
            success: true,
            message: 'Login success, welcome back Admin!',
            token: token
        })
	} else {
        results.json({
            success: false,
            message:'Mohon login terlebih dahulu!'
        })
        }
	
	results.end();
});

//LOGIN PEMBELI
app.post('/login/pembeli', function(request, response) {
	var email = request.body.email;
	var password = request.body.password;
	if (email && password) {
		db.query('SELECT * FROM pembeli WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.email = email;
				response.redirect('/home');
			} else {
				response.send('Email dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Email and Password!');
		response.end();
	}
});


app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Selamat Datang, ' + request.session.email + '!');
	} else {
		response.send('Mohon login terlebih dahulu!');
	}
	response.end();
});

//CRUD PEMBELI

//ini sama dengan register yang dilakukan oleh pembeli
app.post('/pembeli/register',(req, res) => {
    let data = req.body

    let sql = `
        insert into pembeli (nama, kontak, alamat, email, password)
        values ('`+data.nama+`', '`+data.kontak+`','`+data.alamat+`', '`+data.email+`', '`+data.password+`')
    `
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Register berhasil",
            data: result
        })
    })
})

app.get('/pembeli', isAuthorized, (req, res) => {
    let sql = `
        select nama, kontak, alamat from pembeli
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Berhasil mendapatkan data pembeli",
            data: result
        })
    })
})

app.get('/pembeli/:id_pembeli', isAuthorized, (req, res) => {
    let sql = `
        select nama, kontak, alamat from pembeli
        where id_pembeli = `+req.params.id_pembeli+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Dapat data pembeli dari id",
            data: result[0]
        })
    })
})

app.put('/pembeli/:id_pembeli', (req, res) => {
    let data = req.body

    let sql = `
        update pembeli
        set nama = '`+data.nama+`', kontak = '`+data.kontak+`', alamat = '`+data.alamat+`', email = '`+data.email+`', password = '`+data.password+`'
        where id_pembeli = '`+req.params.id_pembeli+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "DATA DIUPDATE",
            data: result
        })
    })
})

app.delete('/pembeli/:id_pembeli', isAuthorized,(req, res) => {
    let sql = `
        delete from pembeli
        where id_pembeli = '`+req.params.id_pembeli+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "DATA DIHAPUS",
            data: result
        })
    })
})

//CRUD Barang

app.post('/barang',  isAuthorized,(req, res) => {
    let data = req.body

    let sql = `
        insert into barang (merk_brg, netto_brg, harga_brg)
        values ('`+data.merk_brg+`', '`+data.netto_brg+`','`+data.harga_brg+`')
    `
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Berhasil Menambahkan Data",
            data: result
        })
    })
})

app.get('/barang',  (req, res) => {
    let sql = `
        select id_brg, merk_brg, netto_brg, harga_brg from barang
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Berhasil mendapatkan data barang",
            data: result
        })
    })
})

app.get('/barang/:id_brg', isAuthorized, (req, res) => {
    let sql = `
        select merk_brg, netto_brg, harga_brg from barang
        where id_brg = `+req.params.id_brg+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Dapat data barang berdasarkan id",
            data: result[0]
        })
    })
})

app.put('/barang/:id_brg',  isAuthorized,(req, res) => {
    let data = req.body

    let sql = `
        update barang
        set merk_brg = '`+data.merk_brg+`', netto_brg = '`+data.netto_brg+`', harga_brg = '`+data.harga_brg+`'
        where id_brg = '`+req.params.id_brg+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "DATA DIUPDATE",
            data: result
        })
    })
})

app.delete('/barang/:id_brg', isAuthorized,(req, res) => {
    let sql = `
        delete from barang
        where id_brg = '`+req.params.id_brg+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "DATA DIHAPUS",
            data: result
        })
    })
})



//Run Application
app.listen(port, () => {
    console.log('App running on port ' + port)
})
