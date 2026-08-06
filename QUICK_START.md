# QueueLess - Quick Start Guide

## 📋 One-Minute Setup

```bash
# 1. Navigate to project
cd /home/gamp/Documents/QueueLess

# 2. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # or: .venv\Scripts\activate on Windows

# 3. Install dependencies
pip install -r requirements.txt

# ✅ Setup complete!
```

## 🚀 Start the Application

### Open 2 Terminals

**Terminal 1 - Backend Server:**
```bash
cd /home/gamp/Documents/QueueLess/backend
python3 app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: off
```

**Terminal 2 - Frontend Server:**
```bash
cd /home/gamp/Documents/QueueLess/frontend
python3 -m http.server 5500
```

You should see:
```
Serving HTTP on 0.0.0.0 port 5500
```

## 🌐 Open in Browser

Visit: **http://127.0.0.1:5500/index.html**

## 👥 Try the App

### New User Flow
1. Click "Register" 
2. Enter name, email, password (min 6 chars)
3. Click "Create Account"
4. Login with your email/password
5. Click "Join Queue"
6. Select a queue and join
7. Watch your position update in real-time!

### Admin Flow
1. You need to create an admin account first
2. Stop the backend: `Ctrl+C`
3. Run: `python3 -c "from database import *; c = _get_database_connection().cursor(); c.execute('UPDATE users SET role=\"admin\" WHERE email=\"YOUR_EMAIL\"'); c.connection.commit()"`
4. Restart backend: `python3 app.py`
5. Login and access: http://127.0.0.1:5500/admin-dashboard.html

## 📝 Features Ready to Use

✅ **User Features**
- Register & Login
- Join/Leave queues
- Track position in real-time
- View queue history
- Manage profile
- Change password
- Get queue suggestions

✅ **Admin Features**  
- Create queues
- Call next customer
- Skip customers
- Mark as served
- View statistics
- Open/close queues

✅ **Smart Features**
- AI-powered wait time estimates
- Queue suggestions sorted by wait time
- Toast notifications
- Auto-refresh dashboards
- Session persistence
- Mobile responsive design

## 🔧 Troubleshooting

**Can't connect?**
```bash
# Check backend is running:
curl http://127.0.0.1:5000/

# Check frontend is running:
curl http://127.0.0.1:5500/index.html
```

**Port already in use?**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Then restart backend
cd backend && python3 app.py
```

**Database errors?**
```bash
# Reset database
rm backend/queueless.db

# Restart backend - it will recreate the schema automatically
python3 app.py
```

**Stuck on login?**
```javascript
// In browser console:
localStorage.clear()
sessionStorage.clear()
// Then refresh the page
```

## 📚 Documentation

- **Full Setup:** See `README.md`
- **Implementation Details:** See `IMPLEMENTATION_SUMMARY.md`
- **API Reference:** Check code comments in `backend/routes/*.py`

## 🎯 What to Try First

1. **Basic Flow**
   - Register new account
   - Login
   - Join a queue
   - See real-time position updates

2. **Explore Features**
   - Click "Dashboard" tab
   - See queue suggestions
   - Click "History" to see past queues
   - Go to "Profile" to view stats
   - Try changing your password

3. **For Admins**
   - Access admin dashboard
   - Create a new queue
   - Have multiple users join
   - Use call/skip/serve buttons
   - Watch status updates

## 📊 Test Data

No test data needed! Start fresh:
1. Create a user account
2. Create another user account from another browser/incognito
3. Both join the same queue
4. Watch them compete for position!

## ⚡ Quick Facts

- **Backend:** Flask on `http://127.0.0.1:5000`
- **Frontend:** Web server on `http://127.0.0.1:5500`
- **Database:** SQLite3 at `backend/queueless.db`
- **Token Duration:** 12 hours
- **Dashboard Refresh:** Every 10 seconds
- **Admin Refresh:** Every 5 seconds

## 🔒 Security Notes

✅ Passwords are hashed and salted
✅ JWT tokens expire after 12 hours  
✅ Admin routes are protected
✅ Sessions auto-logout on 401 errors

## 📞 Getting Help

1. Check README.md for detailed documentation
2. See IMPLEMENTATION_SUMMARY.md for architecture
3. Review code comments in `.py` and `.js` files
4. Check troubleshooting section above

---

**That's it! You're ready to go!** 🎉

Run the two commands in separate terminals and open the browser.

Any questions? Check the documentation files in the project root.

**Happy Queue Management!** 🚀
