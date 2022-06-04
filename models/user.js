/** User class for message.ly */

const db = require('../db')
const bcrypt = require('bcrypt')
const ExpressError = require('../expressError')

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({username, password, first_name, last_name, phone}) {
    let hashedPass = await bcrypt.hash(password, 12)
    const result = await db.query(`INSERT INTO users 
                                (username, password, first_name, last_name, phone, join_at, last_login_at)
                                VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
                                RETURNING username, password, first_name, last_name, phone`,
                                [username, hashedPass, first_name, last_name, phone])
    return result.rows[0]
  }

  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) {
    const result = await db.query(`SELECT username, password FROM users WHERE username = $1`,
                                    [username])
    const user = result.rows[0]
    if (user){
      if (await bcrypt.compare(password, user.password)){
        return true
      }
    }
    return false
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    const result = await db.query(`UPDATE users SET last_login_at = current_timestamp WHERE username = $1`,
                                    [username]) 
    if (!result.rows){
      throw new ExpressError(`No such user: ${username}`, 404)
    }
  }


  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
  static async all() {
    const result = await db.query(`SELECT username, first_name, last_name, phone FROM users`)
    return result.rows
  }


  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */
  static async get(username) { 
    const result = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users
                                    WHERE username = $1`, [username])
    if (!result.rows[0]){
      throw new ExpressError('User not found', 404)
    }
    return result.rows[0]
  }


  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesFrom(username) { 
    const result = await db.query(`SELECT m.id, m.to_username, u.first_name, u.last_name, u.phone,
                                   m.body, m.sent_at, m.read_at FROM messages AS m 
                                   JOIN users AS u 
                                   ON u.username = m.to_username WHERE m.from_username = $1`,
                                   [username])
    return result.rows.map(x =>{
      return ({
        id: x.id, to_user : {username: x.to_username, first_name: x.first_name, 
        last_name: x.last_name,phone: x.phone}, 
        body: x.body, sent_at: x.sent_at, read_at: x.read_at
      })
    })
  }


  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesTo(username) { 
    const result = await db.query(`SELECT m.id, u.username, u.first_name, u.last_name, u.phone, 
                                    m.body, m.sent_at, m.read_at FROM messages AS m
                                    JOIN users AS u ON m.from_username = u.username
                                    WHERE m.to_username = $1`,
                                    [username])
    return result.rows.map( x =>{
      return ({
        id: x.id, from_user:{username: x.username, first_name: x.first_name, 
        last_name: x.last_name, phone: x.phone}, body: x.body, 
        sent_at: x.sent_at, read_at: x.read_at
      })
    })
  }
}


module.exports = User;