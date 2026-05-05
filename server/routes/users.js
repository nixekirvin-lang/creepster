const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../firebase');
const { authMiddleware } = require('../auth');

const router = express.Router();

async function enrichPost(postData, currentUserId) {
  const userDoc = await db.collection('users').doc(postData.user_id).get();
  const user = userDoc.exists ? {
    id: userDoc.data().id, username: userDoc.data().username,
    display_name: userDoc.data().display_name, profile_pic: userDoc.data().profile_pic
  } : null;
  const likesSnap = await db.collection('likes').where('post_id', '==', postData.id).count().get();
  const repostsSnap = await db.collection('reposts').where('post_id', '==', postData.id).count().get();
  const repliesSnap = await db.collection('posts').where('reply_to', '==', postData.id).count().get();
  let liked = false, reposted = false;
  if (currentUserId) {
    liked = !(await db.collection('likes').where('user_id', '==', currentUserId).where('post_id', '==', postData.id).limit(1).get()).empty;
    reposted = !(await db.collection('reposts').where('user_id', '==', currentUserId).where('post_id', '==', postData.id).limit(1).get()).empty;
  }
  return { ...postData, user, likes: likesSnap.data().count, reposts: repostsSnap.data().count, replies: repliesSnap.data().count, liked, reposted };
}

router.get('/:username', authMiddleware, async (req, res) => {
  try {
    const userSnap = await db.collection('users').where('username', '==', req.params.username).limit(1).get();
    if (userSnap.empty) return res.status(404).json({ error: 'User not found' });
    const user = userSnap.docs[0].data();
    const { password_hash, ...safeUser } = user;

    const followersSnap = await db.collection('follows').where('following_id', '==', user.id).count().get();
    const followingSnap = await db.collection('follows').where('follower_id', '==', user.id).count().get();
    const postsSnap = await db.collection('posts').where('user_id', '==', user.id).count().get();
    const followSnap = await db.collection('follows').where('follower_id', '==', req.userId).where('following_id', '==', user.id).limit(1).get();

    res.json({
      ...safeUser,
      followers: followersSnap.data().count,
      following: followingSnap.data().count,
      posts: postsSnap.data().count,
      isFollowing: !followSnap.empty
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:username/posts', authMiddleware, async (req, res) => {
  try {
    const userSnap = await db.collection('users').where('username', '==', req.params.username).limit(1).get();
    if (userSnap.empty) return res.status(404).json({ error: 'User not found' });
    const userId = userSnap.docs[0].data().id;

    const allPostsSnap = await db.collection('posts').get();
    const posts = [];
    for (const doc of allPostsSnap.docs) {
      const data = doc.data();
      if (data.user_id === userId && !data.reply_to) {
        posts.push(await enrichPost(data, req.userId));
      }
    }
    posts.sort((a, b) => a.created_at > b.created_at ? -1 : 1);
    res.json({ posts: posts.slice(0, 20), nextCursor: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:username/likes', authMiddleware, async (req, res) => {
  try {
    const userSnap = await db.collection('users').where('username', '==', req.params.username).limit(1).get();
    if (userSnap.empty) return res.status(404).json({ error: 'User not found' });
    const userId = userSnap.docs[0].data().id;

    const allLikesSnap = await db.collection('likes').where('user_id', '==', userId).get();
    const posts = [];
    for (const likeDoc of allLikesSnap.docs) {
      const postDoc = await db.collection('posts').doc(likeDoc.data().post_id).get();
      if (postDoc.exists) posts.push(await enrichPost(postDoc.data(), req.userId));
    }
    res.json({ posts: posts.slice(0, 20), nextCursor: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:username/replies', authMiddleware, async (req, res) => {
  try {
    const userSnap = await db.collection('users').where('username', '==', req.params.username).limit(1).get();
    if (userSnap.empty) return res.status(404).json({ error: 'User not found' });
    const userId = userSnap.docs[0].data().id;

    const allPostsSnap = await db.collection('posts').get();
    const posts = [];
    for (const doc of allPostsSnap.docs) {
      const data = doc.data();
      if (data.user_id === userId && data.reply_to) {
        posts.push(await enrichPost(data, req.userId));
      }
    }
    posts.sort((a, b) => a.created_at > b.created_at ? -1 : 1);
    res.json({ posts: posts.slice(0, 20), nextCursor: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:username/followers', authMiddleware, async (req, res) => {
  try {
    const userSnap = await db.collection('users').where('username', '==', req.params.username).limit(1).get();
    if (userSnap.empty) return res.status(404).json({ error: 'User not found' });
    const userId = userSnap.docs[0].data().id;

    const followsSnap = await db.collection('follows').where('following_id', '==', userId).get();
    const followers = [];
    for (const fDoc of followsSnap.docs) {
      const uDoc = await db.collection('users').doc(fDoc.data().follower_id).get();
      if (uDoc.exists) {
        const u = uDoc.data();
        const isF = !(await db.collection('follows').where('follower_id', '==', req.userId).where('following_id', '==', u.id).limit(1).get()).empty;
        followers.push({ id: u.id, username: u.username, display_name: u.display_name, profile_pic: u.profile_pic, bio: u.bio, isFollowing: isF });
      }
    }
    res.json(followers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:username/following', authMiddleware, async (req, res) => {
  try {
    const userSnap = await db.collection('users').where('username', '==', req.params.username).limit(1).get();
    if (userSnap.empty) return res.status(404).json({ error: 'User not found' });
    const userId = userSnap.docs[0].data().id;

    const followsSnap = await db.collection('follows').where('follower_id', '==', userId).get();
    const following = [];
    for (const fDoc of followsSnap.docs) {
      const uDoc = await db.collection('users').doc(fDoc.data().following_id).get();
      if (uDoc.exists) {
        const u = uDoc.data();
        const isF = !(await db.collection('follows').where('follower_id', '==', req.userId).where('following_id', '==', u.id).limit(1).get()).empty;
        following.push({ id: u.id, username: u.username, display_name: u.display_name, profile_pic: u.profile_pic, bio: u.bio, isFollowing: isF });
      }
    }
    res.json(following);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:username/follow', authMiddleware, async (req, res) => {
  try {
    const userSnap = await db.collection('users').where('username', '==', req.params.username).limit(1).get();
    if (userSnap.empty) return res.status(404).json({ error: 'User not found' });
    const targetId = userSnap.docs[0].data().id;
    if (targetId === req.userId) return res.status(400).json({ error: 'Cannot follow yourself' });

    const existingSnap = await db.collection('follows')
      .where('follower_id', '==', req.userId)
      .where('following_id', '==', targetId)
      .limit(1).get();

    if (!existingSnap.empty) {
      await existingSnap.docs[0].ref.delete();
      res.json({ following: false });
    } else {
      await db.collection('follows').doc(uuidv4()).set({
        id: uuidv4(),
        follower_id: req.userId,
        following_id: targetId,
        created_at: new Date().toISOString()
      });
      await db.collection('notifications').doc(uuidv4()).set({
        id: uuidv4(),
        user_id: targetId,
        actor_id: req.userId,
        type: 'follow',
        post_id: null,
        read: false,
        created_at: new Date().toISOString()
      });
      res.json({ following: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
