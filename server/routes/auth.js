const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../firebase');
const { authMiddleware, generateToken } = require('../auth');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, display_name, email, password } = req.body;
    if (!username || !email || !password || !display_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be 3-30 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores' });
    }

    const usernameSnap = await db.collection('users').where('username', '==', username).limit(1).get();
    if (!usernameSnap.empty) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    const emailSnap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!emailSnap.empty) {
      return res.status(409).json({ error: 'Email already taken' });
    }

    const id = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    const userData = {
      id,
      username,
      display_name,
      email,
      password_hash: hash,
      bio: '',
      profile_pic: '',
      banner: '',
      join_date: new Date().toISOString(),
      theme_config: {},
      effects_config: {},
      layout_config: {},
      char_limit: 300,
      haunt_mode: false
    };
    await db.collection('users').doc(id).set(userData);

    const token = generateToken(id);
    const { password_hash, ...safeUser } = userData;
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    let user = null;
    const emailSnap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!emailSnap.empty) {
      user = emailSnap.docs[0].data();
    } else {
      const usernameSnap = await db.collection('users').where('username', '==', email).limit(1).get();
      if (!usernameSnap.empty) {
        user = usernameSnap.docs[0].data();
      }
    }

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let user = null;
    const uidSnap = await db.collection('users').where('firebase_uid', '==', uid).limit(1).get();
    if (!uidSnap.empty) {
      user = uidSnap.docs[0].data();
    } else {
      const emailSnap = await db.collection('users').where('email', '==', email).limit(1).get();
      if (!emailSnap.empty) {
        user = emailSnap.docs[0].data();
        await db.collection('users').doc(user.id).update({ firebase_uid: uid });
      }
    }

    if (!user) {
      const baseUsername = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user';
      let username = baseUsername;
      let counter = 1;
      while (true) {
        const check = await db.collection('users').where('username', '==', username).limit(1).get();
        if (check.empty) break;
        username = `${baseUsername}${counter++}`;
      }

      const id = uuidv4();
      user = {
        id,
        username,
        display_name: displayName || username,
        email,
        password_hash: '',
        firebase_uid: uid,
        bio: '',
        profile_pic: photoURL || '',
        banner: '',
        join_date: new Date().toISOString(),
        theme_config: {},
        effects_config: {},
        layout_config: {},
        char_limit: 300,
        haunt_mode: false
      };
      await db.collection('users').doc(id).set(user);
    } else {
      if (photoURL && !user.profile_pic) {
        await db.collection('users').doc(user.id).update({ profile_pic: photoURL });
        user.profile_pic = photoURL;
      }
    }

    const token = generateToken(user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    const user = userDoc.data();
    const { password_hash, ...safeUser } = user;

    const followersSnap = await db.collection('follows').where('following_id', '==', user.id).count().get();
    const followingSnap = await db.collection('follows').where('follower_id', '==', user.id).count().get();
    const postsSnap = await db.collection('posts').where('user_id', '==', user.id).count().get();

    res.json({
      ...safeUser,
      followers: followersSnap.data().count,
      following: followingSnap.data().count,
      posts: postsSnap.data().count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { username, display_name, bio, profile_pic, banner, theme_config, effects_config, layout_config, char_limit, haunt_mode } = req.body;
    const updates = {};

    if (username !== undefined) {
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({ error: 'Username must be 3-30 characters' });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores' });
      }
      const existing = await db.collection('users').where('username', '==', username).limit(1).get();
      if (!existing.empty && existing.docs[0].data().id !== req.userId) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      updates.username = username;
    }

    if (display_name !== undefined) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;
    if (profile_pic !== undefined) updates.profile_pic = profile_pic;
    if (banner !== undefined) updates.banner = banner;
    if (theme_config !== undefined) updates.theme_config = theme_config;
    if (effects_config !== undefined) updates.effects_config = effects_config;
    if (layout_config !== undefined) updates.layout_config = layout_config;
    if (char_limit !== undefined) updates.char_limit = char_limit;
    if (haunt_mode !== undefined) updates.haunt_mode = haunt_mode;

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });

    await db.collection('users').doc(req.userId).update(updates);
    const userDoc = await db.collection('users').doc(req.userId).get();
    const user = userDoc.data();
    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
