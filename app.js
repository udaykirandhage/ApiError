const {open} = require('sqlite')
const sqlite = require('sqlite')
const sqlite3 = require('sqlite3')
const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'userData.db')
let db = null
const establish_Connections = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running')
    })
  } catch (e) {
    response.send(e.message)
    process.exit(1)
  }
}
establish_Connections()

app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const HashedPassword = await bcrypt.hash(password, 10)
  const selectedQuery = `SELECT * FROM user WHERE username ='${username}';`
  const dbuser = await db.get(selectedQuery)
  //console.log(password.length)
  const compare = await bcrypt.compare(password, dbuser.password)
  if (password.length < 5) {
    response.send('Password is too short')
    response.status(400)

    return
  }
  if (dbuser === undefined) {
    const createUser = `INSERT INTO user(username, name, password, gender, location)
      VALUES ('${username}', '${name}', '${HashedPassword}', '${gender}', '${location}');`
    await db.run(createUser)
    response.send('User created successfully')
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const queryLogin = `select * from user where username ='${username}';`
  const dbuser = await db.get(queryLogin)
  //const compare = await bcrypt.compare(password, dbuser.password)
  if (dbuser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const compare = await bcrypt.compare(password, dbuser.password)
    if (compare === true) {
      response.send('Login Success!')
    } else {
      //response.status(400)
      response.send('Invalid password')
      process.exit(1)
    }
  }
})

app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body

  const checkForUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(checkForUserQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('User not registered')
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password)

    if (!isValidPassword) {
      response.status(400)
      response.send('Invalid current password')
    } else {
      const lengthOfNewPassword = newPassword.length

      if (lengthOfNewPassword < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `UPDATE user SET password='${encryptedPassword}' WHERE username='${username}';`

        await db.run(updatePasswordQuery)

        response.send('Password updated')
      }
    }
  }
})

module.exports = app
