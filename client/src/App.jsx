import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

var API = 'https://creepster.vercel.app';

function fetchWithTimeout(url, options, timeout) {
  var isMobile = window.innerWidth <= 768;
  timeout = timeout || (isMobile ? 20000 : 10000);
  return Promise.race([
    fetch(url, options),
    new Promise(function(_, reject) {
      setTimeout(function() { reject(new Error('Request timed out')); }, timeout);
    })
  ]);
}

function Icon({ name, size, color }) {
  var s = size || 18;
  var c = color || 'currentColor';
  var icons = {
    home: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    search: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    bell: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    mail: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    user: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    reply: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
    repost: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
    heart: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    heartFilled: <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    dislike: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>,
    dislikeFilled: <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>,
    back: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    image: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    x: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  };
  return icons[name] || null;
}

function fmt(d) {
  try {
    if (!d) return '';
    var dt = new Date(d);
    if (isNaN(dt.getTime())) { dt = new Date(d + 'Z'); }
    if (isNaN(dt.getTime())) return '';
    var m = Math.floor((Date.now() - dt.getTime()) / 60000);
    if (m < 1) return 'now';
    if (m < 60) return m + 'm';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h';
    return Math.floor(h / 24) + 'd';
  } catch(e) { return ''; }
}

function fmtDate(d) {
  try {
    if (!d) return '';
    var dt = new Date(d);
    if (isNaN(dt.getTime())) { dt = new Date(d + 'Z'); }
    if (isNaN(dt.getTime())) return '';
    return dt.toLocaleString();
  } catch(e) { return ''; }
}

   var inpStyle = {width:'100%',padding:'12px 14px',background:'#eff3f4',border:'1px solid transparent',borderRadius:9999,color:'#0f1419',fontSize:'0.95rem',fontFamily:'Inter',transition:'border-color 0.2s, background 0.2s'};

function App() {
  var [screen, setScreen] = useState('loading');
  var [user, setUser] = useState(null);
  var [posts, setPosts] = useState([]);
  var [view, setView] = useState('home');
  var [err, setErr] = useState('');
  var [busy, setBusy] = useState(false);
  var [postText, setPostText] = useState('');
  var [postImg, setPostImg] = useState('');
  var [postImgFile, setPostImgFile] = useState(null);
  var [profile, setProfile] = useState(null);
  var [profilePosts, setProfilePosts] = useState([]);
  var [notifs, setNotifs] = useState([]);
  var [convos, setConvos] = useState([]);
  var [chatMsgs, setChatMsgs] = useState([]);
  var [chatUser, setChatUser] = useState(null);
  var [msgText, setMsgText] = useState('');
  var [searchQ, setSearchQ] = useState('');
  var [searchRes, setSearchRes] = useState({users:[],posts:[]});
  var [viewPost, setViewPost] = useState(null);
  var [viewReplies, setViewReplies] = useState([]);
  var [replyText, setReplyText] = useState('');
  var [editForm, setEditForm] = useState({display_name:'',bio:'',profile_pic:'',banner:''});
  var [editSaved, setEditSaved] = useState(false);
  var [uploading, setUploading] = useState(false);
  var [followersList, setFollowersList] = useState([]);
  var [followingList, setFollowingList] = useState([]);
  var [listTitle, setListTitle] = useState('');
  var [chatImg, setChatImg] = useState('');
  var [chatImgFile, setChatImgFile] = useState(null);
  var [repostModal, setRepostModal] = useState(null);
  var [repostText, setRepostText] = useState('');
  var fileRef = useRef(null);
  var chatFileRef = useRef(null);

  function hdr() { return {'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('creepster_token')}; }
  function go(v) { setView(v); }

  useEffect(function() {
    var t = localStorage.getItem('creepster_token');
    if (!t) { setScreen('login'); return; }

    var cached = localStorage.getItem('creepster_user');
    if (cached) {
      try {
        var cu = JSON.parse(cached);
        if (cu && cu.id) { setUser(cu); setScreen('app'); }
      } catch(e) {}
    }

    var authPromise = fetchWithTimeout(API + '/api/auth/me', {headers:{'Authorization':'Bearer '+t}}, 20000)
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) {
        if (d && d.id) { setUser(d); localStorage.setItem('creepster_user', JSON.stringify(d)); return d; }
        else if (!cached) { localStorage.removeItem('creepster_token'); localStorage.removeItem('creepster_user'); setScreen('login'); return null; }
        return null;
      })
      .catch(function() { if (!cached) { localStorage.removeItem('creepster_token'); setScreen('login'); } return null; });

    var feedPromise = fetchWithTimeout(API + '/api/posts/feed', {headers:{'Content-Type':'application/json','Authorization':'Bearer '+t}}, 20000)
      .then(function(r){return r.ok?r.json():null})
      .then(function(d){if(d&&d.posts){setPosts(d.posts)}})
      .catch(function(){});

    Promise.all([authPromise, feedPromise]).then(function() { setScreen('app'); });
  }, []);

  function loadFeed() {
    fetchWithTimeout(API + '/api/posts/feed', {headers:hdr()}, 10000)
      .then(function(r){return r.ok?r.json():null})
      .then(function(d){if(d&&d.posts)setPosts(d.posts)})
      .catch(function(){});
  }

  function doLogin(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    var fd = new FormData(e.target);
    fetchWithTimeout(API+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:fd.get('email'),password:fd.get('password')})},10000)
      .then(function(r){return r.json()})
      .then(function(d){
        if(d.error){setErr(d.error)}
        else{localStorage.setItem('creepster_token',d.token);localStorage.setItem('creepster_user',JSON.stringify(d.user));setUser(d.user);setScreen('app');setView('home');loadFeed()}
        setBusy(false);
      })
      .catch(function(e){setErr(String(e.message||'Connection failed'));setBusy(false)});
  }

  function doSignup(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    var fd = new FormData(e.target);
    fetchWithTimeout(API+'/api/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:fd.get('username'),display_name:fd.get('display_name'),email:fd.get('email'),password:fd.get('password')})},10000)
      .then(function(r){return r.json()})
      .then(function(d){
        if(d.error){setErr(d.error)}
        else{localStorage.setItem('creepster_token',d.token);localStorage.setItem('creepster_user',JSON.stringify(d.user));setUser(d.user);setScreen('app');setView('home');loadFeed()}
        setBusy(false);
      })
      .catch(function(e){setErr(String(e.message||'Connection failed'));setBusy(false)});
  }

  function doGoogle() {
    setErr(''); setBusy(true);
    import('./firebase').then(function(mod){
      var a=mod.auth,gp=mod.googleProvider;
      if(!a||!gp){setErr('Google unavailable');setBusy(false);return}
      import('firebase/auth').then(function(fba){
        fba.signInWithPopup(a,gp).then(function(r){
          var fu=r.user;
          fetchWithTimeout(API+'/api/auth/google',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({uid:fu.uid,email:fu.email,displayName:fu.displayName,photoURL:fu.photoURL})},10000)
            .then(function(r){return r.json()})
            .then(function(d){
              if(d.error){setErr(d.error)}
              else{localStorage.setItem('creepster_token',d.token);localStorage.setItem('creepster_user',JSON.stringify(d.user));setUser(d.user);setScreen('app');setView('home');loadFeed()}
              setBusy(false);
            });
        }).catch(function(e){if(e.code!=='auth/popup-closed-by-user')setErr(String(e.message||'Google failed'));setBusy(false)});
      });
    }).catch(function(){setErr('Google unavailable');setBusy(false)});
  }

  function doLogout(){localStorage.removeItem('creepster_token');localStorage.removeItem('creepster_user');setUser(null);setScreen('login');setPosts([])}

  function compressImage(file, maxWidth, quality) {
    maxWidth = maxWidth || 800;
    quality = quality || 0.7;
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement('canvas');
          var w = img.width;
          var h = img.height;
          if (w > maxWidth) {
            h = Math.round(h * maxWidth / w);
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          var dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function uploadImg(file){
    return new Promise(function(resolve){
      setUploading(true);
      compressImage(file, 800, 0.7).then(function(dataUrl) {
        setUploading(false);
        resolve(dataUrl);
      }).catch(function() {
        setUploading(false);
        resolve('');
      });
    });
  }

  function doPost(e){
    e.preventDefault();
    if(!postText.trim()&&!postImg)return;
    setBusy(true);
    var submit=function(url){
      fetchWithTimeout(API+'/api/posts',{method:'POST',headers:hdr(),body:JSON.stringify({content:postText,image_url:url})},10000)
        .then(function(r){return r.json()})
        .then(function(){setPostText('');setPostImg('');setPostImgFile(null);setBusy(false);loadFeed()})
        .catch(function(){setBusy(false)});
    };
    if(postImgFile){uploadImg(postImgFile).then(submit)}else{submit(postImg)}
  }

  function handleImg(e){
    var f=e.target.files[0];if(!f)return;
    setPostImgFile(f);
    compressImage(f, 400, 0.6).then(function(dataUrl){
      setPostImg(dataUrl);
    });
  }

  function doDelete(id){
    fetchWithTimeout(API+'/api/posts/'+id,{method:'DELETE',headers:hdr()},10000)
      .then(function(r){return r.ok?r.json():null})
      .then(function(d){if(d&&d.success){setPosts(function(prev){return prev.filter(function(p){return p.id!==id})});setProfilePosts(function(prev){return prev.filter(function(p){return p.id!==id})});if(viewPost&&viewPost.id===id)go('home')}})
      .catch(function(){});
  }

  function doReply(e){
    e.preventDefault();if(!replyText.trim()||!viewPost)return;
    fetchWithTimeout(API+'/api/posts',{method:'POST',headers:hdr(),body:JSON.stringify({content:replyText,reply_to:viewPost.id})},10000)
      .then(function(r){return r.json()})
      .then(function(){setReplyText('');doLoadPost(viewPost.id)});
  }

  function doLike(id){
    fetchWithTimeout(API+'/api/posts/'+id+'/like',{method:'POST',headers:hdr()},10000)
      .then(function(r){return r.json()})
      .then(function(u){if(!u||!u.id)return;setPosts(function(p){return p.map(function(x){return x.id===id?u:x})});if(viewPost&&viewPost.id===id)setViewPost(u);setProfilePosts(function(p){return p.map(function(x){return x.id===id?u:x})});setViewReplies(function(p){return p.map(function(x){return x.id===id?u:x})})})
      .catch(function(){});
  }

  function doDislike(id){
    fetchWithTimeout(API+'/api/posts/'+id+'/dislike',{method:'POST',headers:hdr()},10000)
      .then(function(r){return r.json()})
      .then(function(u){if(!u||!u.id)return;setPosts(function(p){return p.map(function(x){return x.id===id?u:x})});if(viewPost&&viewPost.id===id)setViewPost(u);setProfilePosts(function(p){return p.map(function(x){return x.id===id?u:x})});setViewReplies(function(p){return p.map(function(x){return x.id===id?u:x})})})
      .catch(function(){});
  }

  function doRepost(id){
    setRepostModal(posts.find(function(p){return p.id===id})||viewPost);
    setRepostText('');
  }

  function submitRepost(e){
    e.preventDefault();
    if(!repostModal)return;
    var originalUser=repostModal.user?repostModal.user.display_name:'Unknown';
    var originalContent=repostModal.content||'';
    var content=repostText.trim()?repostText.trim()+'\n\n↳ Resurfaced from @'+originalUser+':\n'+originalContent:'↳ Resurfaced from @'+originalUser+':\n'+originalContent;
    fetchWithTimeout(API+'/api/posts',{method:'POST',headers:hdr(),body:JSON.stringify({content:content})},10000)
      .then(function(r){return r.json()})
      .then(function(){setRepostModal(null);setRepostText('');loadFeed()})
      .catch(function(){});
  }

  function loadProfile(un){
    Promise.all([
      fetchWithTimeout(API+'/api/users/'+un,{headers:hdr()},10000).then(function(r){return r.ok?r.json():null}),
      fetchWithTimeout(API+'/api/users/'+un+'/posts',{headers:hdr()},10000).then(function(r){return r.ok?r.json():{posts:[]}})
    ]).then(function(a){if(a[0]&&a[0].id)setProfile(a[0]);if(a[1]&&a[1].posts)setProfilePosts(a[1].posts);go('profile')}).catch(function(){go('profile')});
  }

  function doFollow(un){
    fetchWithTimeout(API+'/api/users/'+un+'/follow',{method:'POST',headers:hdr()},10000).then(function(){loadProfile(un)}).catch(function(){});
  }

  function doLoadPost(id){
    fetchWithTimeout(API+'/api/posts/'+id,{headers:hdr()},10000)
      .then(function(r){return r.ok?r.json():null})
      .then(function(d){if(d&&d.post){setViewPost(d.post);setViewReplies(d.replies||[]);go('post')}})
      .catch(function(){});
  }

  function loadNotifs(){
    fetchWithTimeout(API+'/api/notifications',{headers:hdr()},10000).then(function(r){return r.ok?r.json():{notifications:[]}}).then(function(d){if(d&&d.notifications)setNotifs(d.notifications);go('notifs')}).catch(function(){go('notifs')});
    fetchWithTimeout(API+'/api/notifications/read',{method:'POST',headers:hdr()},10000).catch(function(){});
  }

  function loadConvos(){
    fetchWithTimeout(API+'/api/messages/conversations',{headers:hdr()},10000).then(function(r){return r.ok?r.json():[]}).then(function(d){if(Array.isArray(d))setConvos(d);go('msgs')}).catch(function(){go('msgs')});
  }

  function loadChat(uid){
    fetchWithTimeout(API+'/api/messages/'+uid,{headers:hdr()},10000).then(function(r){return r.ok?r.json():null}).then(function(d){if(d&&d.messages){setChatMsgs(d.messages);setChatUser(d.otherUser);go('chat')}}).catch(function(){});
  }

  function sendMsg(e){
    e.preventDefault();
    if((!msgText.trim()&&!chatImg)||!chatUser)return;
    var doSend=function(imgUrl){
      var content=msgText.trim();
      if(imgUrl){content=content?content+' '+imgUrl:imgUrl}
      fetchWithTimeout(API+'/api/messages/'+chatUser.id,{method:'POST',headers:hdr(),body:JSON.stringify({content:content})},10000)
        .then(function(){setMsgText('');setChatImg('');setChatImgFile(null);loadChat(chatUser.id)})
        .catch(function(){});
    };
    if(chatImgFile){uploadImg(chatImgFile).then(doSend)}else{doSend(chatImg)}
  }

  function handleChatImg(e){
    var f=e.target.files[0];if(!f)return;
    setChatImgFile(f);
    compressImage(f, 400, 0.6).then(function(dataUrl){
      setChatImg(dataUrl);
    });
  }

  function doSearch(e){
    e.preventDefault();if(!searchQ.trim())return;
    fetchWithTimeout(API+'/api/search?q='+encodeURIComponent(searchQ),{headers:hdr()},10000).then(function(r){return r.ok?r.json():{users:[],posts:[]}}).then(function(d){setSearchRes(d);go('search')}).catch(function(){go('search')});
  }

  function openEdit(){
    setEditForm({username:user.username||'',display_name:user.display_name||'',bio:user.bio||'',profile_pic:user.profile_pic||'',banner:user.banner||''});
    setEditSaved(false);go('editProfile');
  }

  function doEdit(e){
    e.preventDefault();setEditSaved(false);
    fetchWithTimeout(API+'/api/auth/me',{method:'PUT',headers:hdr(),body:JSON.stringify(editForm)},10000)
      .then(function(r){return r.ok?r.json():null})
      .then(function(d){if(d&&d.id){setUser(d);localStorage.setItem('creepster_user',JSON.stringify(d));setEditSaved(true);setTimeout(function(){setEditSaved(false)},2000)}})
      .catch(function(){});
  }

  function loadFollowers(username){
    fetchWithTimeout(API+'/api/users/'+username+'/followers',{headers:hdr()},10000)
      .then(function(r){return r.ok?r.json():[]})
      .then(function(d){if(Array.isArray(d)){setFollowersList(d);setListTitle('Followers');go('userlist')}})
      .catch(function(){go('userlist')});
  }

  function loadFollowing(username){
    fetchWithTimeout(API+'/api/users/'+username+'/following',{headers:hdr()},10000)
      .then(function(r){return r.ok?r.json():[]})
      .then(function(d){if(Array.isArray(d)){setFollowingList(d);setListTitle('Following');go('userlist')}})
      .catch(function(){go('userlist')});
  }

  function doFollowFromList(username){
    fetchWithTimeout(API+'/api/users/'+username+'/follow',{method:'POST',headers:hdr()},10000)
      .then(function(){})
      .catch(function(){});
    setFollowersList(function(prev){return prev.map(function(u){return u.username===username?{...u,isFollowing:!u.isFollowing}:u})});
    setFollowingList(function(prev){return prev.map(function(u){return u.username===username?{...u,isFollowing:!u.isFollowing}:u})});
  }

  if(screen==='loading') return <div style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:'100vh',background:'#ffffff',color:'#536471'}}><div style={{width:32,height:32,border:'3px solid #eff3f4',borderTopColor:'#ff3333',borderRadius:'50%',marginBottom:16}}></div><span style={{fontFamily:'Inter',fontWeight:500}}>Loading...</span></div>;

  if(screen==='login') return <LoginScreen doLogin={doLogin} doSignup={doSignup} doGoogle={doGoogle} err={err} busy={busy} setErr={setErr} />;

   return (
     <div style={{display:'flex',minHeight:'100vh',background:'#ffffff',color:'#0f1419'}}>
      <nav className="sidebar-desktop" style={{width:275,borderRight:'1px solid #eff3f4',display:'none',flexDirection:'column',padding:'0 12px',position:'sticky',top:0,height:'100vh',overflowY:'auto',background:'#ffffff'}}>
        <h2 style={{fontFamily:'Creepster',fontSize:'2.2rem',color:'#ff3333',padding:'12px 12px',cursor:'pointer',letterSpacing:'2px',lineHeight:1}} onClick={function(){go('home');loadFeed()}}>Creepster</h2>
        <NavItem icon="home" label="Home" active={view==='home'} onClick={function(){go('home');loadFeed()}} />
        <NavItem icon="search" label="Explore" active={view==='search'} onClick={function(){setSearchQ('');go('search')}} />
        <NavItem icon="bell" label="Notifications" active={view==='notifs'} onClick={loadNotifs} />
        <NavItem icon="mail" label="Messages" active={view==='msgs'||view==='chat'} onClick={loadConvos} />
        <NavItem icon="user" label="Profile" active={view==='profile'} onClick={function(){user&&loadProfile(user.username)}} />
       <div style={{marginTop:'auto',padding:'16px',borderTop:'1px solid #eff3f4'}}>
           <div style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',padding:'8px',borderRadius:9999,transition:'background 0.2s'}} onClick={function(){user&&loadProfile(user.username)}}>
             {user&&user.profile_pic?<div style={{width:40,height:40,borderRadius:'50%',background:'url('+user.profile_pic+') center/cover',border:'2px solid #eff3f4',overflow:'hidden'}}/>:<div style={{width:40,height:40,borderRadius:'50%',background:'#eff3f4',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#ff3333',border:'2px solid #eff3f4',fontFamily:'Inter',fontSize:'1rem'}}>{user?user.display_name[0]:'?'}</div>}
             <div><div style={{fontWeight:700,fontSize:'0.9rem',color:'#0f1419'}}>{user&&user.display_name}</div><div style={{color:'#536471',fontSize:'0.8rem'}}>@{user&&user.username}</div></div>
           </div>
           <button onClick={doLogout} style={{width:'100%',padding:'10px',background:'transparent',border:'1px solid #dcddde',borderRadius:9999,color:'#536471',cursor:'pointer',fontSize:'0.85rem',fontWeight:500,marginTop:8,transition:'background 0.2s'}}>Logout</button>
         </div>
      </nav>
       <main className="main-content-area" style={{flex:1,minWidth:0,borderRight:'1px solid #eff3f4',minHeight:'100vh',background:'#ffffff'}}>
        {view==='home'&&<>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #eff3f4',position:'sticky',top:0,background:'rgba(255,255,255,0.85)',backdropFilter:'blur(12px)',zIndex:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3 style={{margin:0,fontFamily:'Inter', fontWeight:700, fontSize:'1.25rem'}}>Home</h3><span onClick={loadFeed} style={{cursor:'pointer',color:'#ff3333',fontSize:'0.85rem',fontWeight:500}}>Refresh</span></div>
           <form onSubmit={doPost} style={{padding:16,borderBottom:'1px solid #eff3f4'}}>
             <textarea value={postText} onChange={function(e){setPostText(e.target.value)}} placeholder="What haunts you?" style={{width:'100%',padding:0,background:'transparent',border:'none',color:'#0f1419',fontSize:'1.1rem',fontFamily:'Inter',resize:'none',outline:'none'}} rows={3}/>
             {postImg&&<div style={{marginTop:8,position:'relative',display:'inline-block'}}><img src={postImg} alt="" style={{maxHeight:150,borderRadius:16,border:'1px solid #dcddde'}}/><div onClick={function(){setPostImg('');setPostImgFile(null)}} style={{position:'absolute',top:-8,right:-8,width:24,height:24,borderRadius:'50%',background:'#ffffff',border:'1px solid #dcddde',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}}><Icon name="x" size={14}/></div></div>}
             <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:12,borderTop:'1px solid #eff3f4'}}>
               <div style={{display:'flex',alignItems:'center',gap:8}}>
                 <div onClick={function(){fileRef.current&&fileRef.current.click()}} style={{padding:8,borderRadius:'50%',cursor:'pointer',color:'#ff3333',transition:'background 0.2s'}}><Icon name="image" size={20}/></div>
                 <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{display:'none'}}/>
                 <span style={{color:'#536471',fontSize:'0.8rem'}}>{500-postText.length}</span>
               </div>
               <button type="submit" disabled={(!postText.trim()&&!postImg)||busy||uploading} style={{padding:'8px 20px',background:'#ff3333',border:'none',borderRadius:9999,color:'white',fontWeight:600,cursor:'pointer',fontSize:'0.9rem',opacity:(postText.trim()||postImg)?1:0.5,transition:'opacity 0.2s'}}>{uploading?'Uploading...':busy?'...':'Whisper'}</button>
             </div>
           </form>
          {posts.map(function(p){return <PostCard key={p.id} p={p} doLike={doLike} doDislike={doDislike} doRepost={doRepost} loadPost={doLoadPost} loadProfile={loadProfile} currentUser={user} doDelete={doDelete}/>})}
           {posts.length===0&&<div style={{textAlign:'center',padding:60,color:'#536471',fontFamily:'Inter'}}>The static is quiet...<br/><button onClick={loadFeed} style={{marginTop:16,padding:'8px 20px',background:'#ff3333',border:'none',borderRadius:9999,color:'white',fontWeight:600,cursor:'pointer',fontSize:'0.9rem'}}>Refresh</button></div>}
        </>}
        {view==='post'&&viewPost&&<PostDetail post={viewPost} replies={viewReplies} replyText={replyText} setReplyText={setReplyText} doReply={doReply} doLike={doLike} doDislike={doDislike} doRepost={doRepost} loadPost={doLoadPost} loadProfile={loadProfile} currentUser={user} doDelete={doDelete} onBack={function(){go('home')}}/>}
        {view==='profile'&&profile&&<ProfileView profile={profile} posts={profilePosts} user={user} doFollow={doFollow} doLike={doLike} doDislike={doDislike} doRepost={doRepost} loadPost={doLoadPost} loadProfile={loadProfile} loadChat={loadChat} loadFollowers={loadFollowers} loadFollowing={loadFollowing} doDelete={doDelete} onBack={function(){go('home')}} onEdit={openEdit}/>}
        {view==='userlist'&&<UserListView title={listTitle} users={listTitle==='Followers'?followersList:followingList} onBack={function(){go('profile');loadProfile(profile?profile.username:user.username)}} loadProfile={loadProfile} doFollow={doFollowFromList} currentUser={user}/>}
        {view==='notifs'&&<NotifsView notifs={notifs} loadProfile={loadProfile}/>}
        {view==='msgs'&&<MsgsView convos={convos} loadChat={loadChat}/>}
        {view==='chat'&&chatUser&&<ChatView chatUser={chatUser} msgs={chatMsgs} user={user} msgText={msgText} setMsgText={setMsgText} sendMsg={sendMsg} chatImg={chatImg} setChatImg={setChatImg} setChatImgFile={setChatImgFile} handleChatImg={handleChatImg} chatFileRef={chatFileRef} uploading={uploading} onBack={loadConvos}/>}
        {view==='search'&&<SearchView q={searchQ} setQ={setSearchQ} doSearch={doSearch} res={searchRes} doLike={doLike} doDislike={doDislike} doRepost={doRepost} loadPost={doLoadPost} loadProfile={loadProfile} currentUser={user} doDelete={doDelete}/>}
        {view==='editProfile'&&<EditView form={editForm} setForm={setEditForm} onSave={doEdit} saved={editSaved} onBack={function(){go('profile');loadProfile(user.username)}}/>}
      </main>
       <aside className="sidebar-right-desktop" style={{width:350,position:'sticky',top:0,height:'100vh',overflowY:'auto',padding:16,background:'#ffffff'}}>
         <div style={{background:'#ffffff',border:'1px solid #eff3f4',borderRadius:16,padding:16,marginBottom:16}}>
           <h3 style={{marginBottom:12,fontFamily:'Inter',fontWeight:700,color:'#0f1419'}}>Trending</h3>
           <div style={{color:'#0f1419',fontSize:'0.9rem',fontWeight:500}}>#analoghorror</div>
           <div style={{color:'#536471',fontSize:'0.9rem',marginTop:4}}>#staticvoid</div>
           <div style={{color:'#536471',fontSize:'0.9rem',marginTop:4}}>#midnightbroadcast</div>
         </div>
       </aside>
      
       {/* Mobile Bottom Navigation */}
       <nav className="sidebar-mobile" style={{display:'none',position:'fixed',bottom:0,left:0,right:0,background:'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',borderTop:'1px solid #eff3f4',padding:'8px 0',zIndex:50,justifyContent:'space-around'}}>
         <MobileNavItem icon="home" active={view==='home'} onClick={function(){go('home');loadFeed()}} />
         <MobileNavItem icon="search" active={view==='search'} onClick={function(){setSearchQ('');go('search')}} />
         <MobileNavItem icon="bell" active={view==='notifs'} onClick={loadNotifs} />
         <MobileNavItem icon="mail" active={view==='msgs'||view==='chat'} onClick={loadConvos} />
         <MobileNavItem icon="user" active={view==='profile'} onClick={function(){user&&loadProfile(user.username)}} />
       </nav>
      
      {repostModal&&<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:20}} onClick={function(){setRepostModal(null)}}>
        <div style={{background:'#ffffff',border:'1px solid #eff3f4',borderRadius:16,width:'100%',maxWidth:500,overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.15)'}} onClick={function(e){e.stopPropagation()}}>
          <div style={{padding:'16px',borderBottom:'1px solid #eff3f4',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h3 style={{margin:0,fontFamily:'Inter',fontWeight:700,color:'#0f1419'}}>Resurface Whisper</h3>
            <span style={{cursor:'pointer',color:'#536471'}} onClick={function(){setRepostModal(null)}}><Icon name="x" size={20}/></span>
          </div>
          <form onSubmit={submitRepost}>
            <div style={{padding:16}}>
              <textarea value={repostText} onChange={function(e){setRepostText(e.target.value)}} placeholder="Add your thoughts..." style={{width:'100%',padding:0,background:'transparent',border:'none',color:'#0f1419',fontSize:'1rem',resize:'none',outline:'none',fontFamily:'Inter'}} rows={3} maxLength={200}/>
              <div style={{background:'#f7f9fa',border:'1px solid #eff3f4',borderRadius:12,padding:12,marginTop:12}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{width:24,height:24,borderRadius:'50%',background:'#eff3f4',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#ff3333',fontSize:'0.7rem',border:'1px solid #eff3f4',fontFamily:'Inter'}}>{repostModal.user?repostModal.user.display_name[0]:'?'}</div>
                  <span style={{fontWeight:700,fontSize:'0.85rem',color:'#0f1419'}}>{repostModal.user?repostModal.user.display_name:'Unknown'}</span>
                  <span style={{color:'#536471',fontSize:'0.8rem'}}>@{repostModal.user?repostModal.user.username:''}</span>
                </div>
                <div style={{color:'#0f1419',fontSize:'0.9rem',lineHeight:1.4}}>{repostModal.content}</div>
                {repostModal.image_url&&<img src={repostModal.image_url} alt="" style={{maxWidth:'100%',borderRadius:12,marginTop:8}} onError={function(e){e.target.style.display='none'}}/>}
              </div>
            </div>
            <div style={{padding:'12px 16px',borderTop:'1px solid #eff3f4',display:'flex',justifyContent:'flex-end',gap:8}}>
              <button type="button" onClick={function(){setRepostModal(null)}} style={{padding:'8px 16px',background:'transparent',border:'1px solid #dcddde',borderRadius:9999,color:'#0f1419',fontWeight:600,cursor:'pointer',fontFamily:'Inter'}}>Cancel</button>
              <button type="submit" style={{padding:'8px 20px',background:'#ff3333',border:'none',borderRadius:9999,color:'white',fontWeight:700,cursor:'pointer',fontFamily:'Inter'}}>Resurface</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
}

function LoginScreen({doLogin,doSignup,doGoogle,err,busy,setErr}){
   var [signup,setSignup]=useState(false);
   return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#ffffff',padding:20,fontFamily:'Inter'}}>
     <div style={{background:'#ffffff',border:'1px solid #eff3f4',borderRadius:16,padding:40,width:'100%',maxWidth:420,boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
       <h1 style={{fontSize:'3.5rem',color:'#ff3333',textAlign:'center',letterSpacing:'3px',fontFamily:'Creepster',marginBottom:8,lineHeight:1}}>Creepster</h1>
       <p style={{textAlign:'center',color:'#536471',fontSize:'0.9rem',marginBottom:32,fontWeight:500}}>{signup?'Join the static':'Enter the static'}</p>
       {err&&<div style={{background:'rgba(255,51,51,0.1)',border:'1px solid rgba(255,51,51,0.3)',color:'#ff3333',padding:'12px 14px',borderRadius:12,fontSize:'0.9rem',marginBottom:16}}>{err}</div>}
       <button onClick={doGoogle} disabled={busy} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,width:'100%',padding:'12px 20px',background:'#ffffff',border:'1px solid #dcddde',borderRadius:9999,color:'#0f1419',cursor:'pointer',fontSize:'0.95rem',fontWeight:600,transition:'background 0.2s'}}>
         <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
         Continue with Google
       </button>
       <div style={{display:'flex',alignItems:'center',margin:'24px 0'}}><div style={{flex:1,height:1,background:'#eff3f4'}}/><span style={{color:'#536471',fontSize:'0.9rem',padding:'0 12px',fontWeight:500}}>or</span><div style={{flex:1,height:1,background:'#eff3f4'}}/></div>
       <form onSubmit={signup?doSignup:doLogin}>
         {signup&&<><input name="username" type="text" placeholder="Username" required minLength={3} style={{...inpStyle,marginBottom:12}}/><input name="display_name" type="text" placeholder="Display Name" required style={{...inpStyle,marginBottom:12}}/></>}
         <input name="email" type={signup?'email':'text'} placeholder={signup?'Email':'Email or Username'} required style={{...inpStyle,marginBottom:12}}/>
         <input name="password" type="password" placeholder="Password" required minLength={6} style={{...inpStyle,marginBottom:16}}/>
         <button type="submit" disabled={busy} style={{width:'100%',padding:'12px 20px',background:'#ff3333',border:'none',borderRadius:9999,color:'white',fontWeight:700,cursor:'pointer',fontSize:'0.95rem',fontFamily:'Inter',transition:'background 0.2s'}}>{busy?'...':(signup?'Create Account':'Sign In')}</button>
       </form>
       <p style={{textAlign:'center',color:'#536471',fontSize:'0.9rem',marginTop:20,fontWeight:500}}>
         {signup?'Already have an account? ':'Don\'t have an account? '}
         <span style={{color:'#ff3333',cursor:'pointer',fontWeight:700}} onClick={function(){setErr('');setSignup(!signup)}}>{signup?'Sign in':'Sign up'}</span>
       </p>
    </div>
  </div>;
}

function NavItem({icon,label,active,onClick}){
   return <div onClick={onClick} style={{display:'flex',alignItems:'center',gap:16,padding:'12px 16px',borderRadius:9999,cursor:'pointer',fontWeight:active?700:500,fontSize:'1.1rem',background:active?'rgba(255,51,51,0.1)':'transparent',color:active?'#ff3333':'#0f1419',transition:'background-color 0.2s'}}>
     <Icon name={icon} size={22} color={active?'#ff3333':'#536471'}/> {label}
   </div>;
 }

function MobileNavItem({icon,active,onClick}){
   return <div onClick={onClick} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'8px 12px',cursor:'pointer',minWidth:50,minHeight:44}}>
     <Icon name={icon} size={24} color={active?'#ff3333':'#536471'}/>
   </div>;
 }

function PostCard({p,doLike,doDislike,doRepost,loadPost,loadProfile,currentUser,doDelete}){
   var isOwner=currentUser&&p.user&&currentUser.id===p.user.id;
   var av=p.user&&p.user.profile_pic?<div style={{width:48,height:48,borderRadius:'50%',background:'url('+p.user.profile_pic+') center/cover',flexShrink:0,border:'2px solid #eff3f4',overflow:'hidden'}}/>:<div style={{width:48,height:48,borderRadius:'50%',background:'#eff3f4',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#ff3333',flexShrink:0,border:'2px solid #eff3f4',fontFamily:'Inter',fontSize:'1.1rem'}}>{p.user?p.user.display_name[0]:'?'}</div>;
   return <div style={{display:'flex',gap:12,padding:'16px',borderBottom:'1px solid #eff3f4',background:'#ffffff',transition:'background 0.2s'}}>
    {av}
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
         <span style={{fontWeight:700,cursor:'pointer',color:'#0f1419'}} onClick={function(){loadProfile(p.user&&p.user.username)}}>{p.user?p.user.display_name:'Unknown'}</span>
         <span style={{color:'#536471',fontSize:'0.9rem'}}>@{p.user?p.user.username:''}</span>
         <span style={{color:'#536471',fontSize:'0.85rem'}}>· {fmt(p.created_at)}</span>
         {isOwner&&<span style={{marginLeft:'auto',cursor:'pointer',color:'#536471',padding:'4px 8px',borderRadius:'50%'}} onClick={function(){if(window.confirm('Delete this whisper?'))doDelete(p.id)}}><Icon name="x" size={16}/></span>}
       </div>
      {p.content&&<div style={{marginTop:4,whiteSpace:'pre-wrap',wordBreak:'break-word',lineHeight:1.5,cursor:'pointer',color:'#0f1419',fontSize:'0.95rem'}} onClick={function(){loadPost(p.id)}}>{p.content}</div>}
      {p.image_url&&<div style={{marginTop:8,borderRadius:16,overflow:'hidden',border:'1px solid #dcddde',cursor:'pointer'}} onClick={function(){loadPost(p.id)}}><img src={p.image_url} alt="" style={{width:'100%',display:'block'}} onError={function(e){e.target.style.display='none'}}/></div>}
       <div style={{display:'flex',gap:32,marginTop:12,color:'#536471'}}>
         <span style={{fontSize:'0.9rem',cursor:'pointer',display:'flex',alignItems:'center',gap:4,transition:'color 0.2s'}} onClick={function(){loadPost(p.id)}}><Icon name="reply" size={18}/> <span style={{minWidth:16}}>{p.replies||0}</span></span>
         <span style={{fontSize:'0.9rem',cursor:'pointer',display:'flex',alignItems:'center',gap:4,color:p.reposted?'#00c853':'#536471',transition:'color 0.2s'}} onClick={function(){doRepost(p.id)}}><Icon name="repost" size={18} color={p.reposted?'#00c853':'#536471'}/> <span style={{minWidth:16}}>{p.reposts||0}</span></span>
         <span style={{fontSize:'0.9rem',cursor:'pointer',display:'flex',alignItems:'center',gap:4,color:p.liked?'#ff3333':'#536471',transition:'color 0.2s'}} onClick={function(){doLike(p.id)}}><Icon name={p.liked?'heartFilled':'heart'} size={18} color={p.liked?'#ff3333':'#536471'}/> <span style={{minWidth:16}}>{p.likes||0}</span></span>
         <span style={{fontSize:'0.9rem',cursor:'pointer',display:'flex',alignItems:'center',gap:4,color:p.disliked?'#ff9800':'#536471',transition:'color 0.2s'}} onClick={function(){doDislike(p.id)}}><Icon name={p.disliked?'dislikeFilled':'dislike'} size={18} color={p.disliked?'#ff9800':'#536471'}/> <span style={{minWidth:16}}>{p.dislikes||0}</span></span>
       </div>
    </div>
  </div>;
}

function PostDetail({post,replies,replyText,setReplyText,doReply,doLike,doDislike,doRepost,loadPost,loadProfile,onBack,currentUser,doDelete}){
   var isOwner=currentUser&&post.user&&currentUser.id===post.user.id;
   return <>
     <div style={{padding:'12px 16px',borderBottom:'1px solid #eff3f4',position:'sticky',top:0,background:'rgba(255,255,255,0.85)',backdropFilter:'blur(12px)',zIndex:10}}>
       <span style={{color:'#ff3333',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontWeight:500}} onClick={onBack}><Icon name="back" size={18}/> Back</span>
       <h3 style={{margin:'8px 0 0',fontFamily:'Inter',fontWeight:700,color:'#0f1419'}}>Whisper</h3>
     </div>
     <div style={{padding:16,borderBottom:'1px solid #eff3f4'}}>
       <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
         <div style={{width:48,height:48,borderRadius:'50%',background:'#eff3f4',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#ff3333',fontSize:'1.2rem',border:'2px solid #eff3f4',overflow:'hidden'}}>{post.user?post.user.display_name[0]:'?'}</div>
         <div><div style={{fontWeight:700,fontSize:'1.1rem',color:'#0f1419'}}>{post.user?post.user.display_name:'Unknown'}</div><div style={{color:'#536471'}}>@{post.user?post.user.username:''}</div></div>
         {isOwner&&<span style={{marginLeft:'auto',cursor:'pointer',color:'#536471',padding:'6px 10px',borderRadius:'50%',transition:'background 0.2s'}} onClick={function(){if(window.confirm('Delete this whisper?')){doDelete(post.id);onBack()}}}><Icon name="x" size={18}/></span>}
       </div>
       <div style={{fontSize:'1.1rem',lineHeight:1.6,marginBottom:12,whiteSpace:'pre-wrap',color:'#0f1419'}}>{post.content}</div>
       {post.image_url&&<div style={{marginBottom:12,borderRadius:16,overflow:'hidden',border:'1px solid #dcddde'}}><img src={post.image_url} alt="" style={{width:'100%',display:'block'}}/></div>}
       <div style={{color:'#536471',fontSize:'0.85rem',paddingBottom:12,borderBottom:'1px solid #eff3f4'}}>{fmtDate(post.created_at)}</div>
       <div style={{display:'flex',gap:24,padding:'12px 0',borderBottom:'1px solid #eff3f4',color:'#536471'}}>
         <span><Icon name="repost" size={18}/> <strong style={{color:'#0f1419'}}>{post.reposts||0}</strong> <span>Resurfaces</span></span>
         <span><Icon name={post.liked?'heartFilled':'heart'} size={18} color={post.liked?'#ff3333':'#536471'}/> <strong style={{color:'#0f1419'}}>{post.likes||0}</strong> <span>Echoes</span></span>
       </div>
       <div style={{display:'flex',gap:32,padding:'12px 0',justifyContent:'space-around'}}>
         <span style={{cursor:'pointer',color:'#536471'}}><Icon name="reply" size={22}/></span>
         <span style={{cursor:'pointer',color:post.reposted?'#00c853':'#536471',transition:'color 0.2s'}} onClick={function(){doRepost(post.id)}}><Icon name="repost" size={22} color={post.reposted?'#00c853':'#536471'}/></span>
         <span style={{cursor:'pointer',color:post.liked?'#ff3333':'#536471',transition:'color 0.2s'}} onClick={function(){doLike(post.id)}}><Icon name={post.liked?'heartFilled':'heart'} size={22} color={post.liked?'#ff3333':'#536471'}/></span>
       </div>
     </div>
     <form onSubmit={doReply} style={{padding:16,borderBottom:'1px solid #eff3f4'}}>
       <textarea value={replyText} onChange={function(e){setReplyText(e.target.value)}} placeholder="Whisper your reply..." style={{width:'100%',padding:0,background:'#eff3f4',border:'1px solid transparent',borderRadius:12,color:'#0f1419',fontSize:'1rem',fontFamily:'Inter',resize:'none',outline:'none',transition:'border-color 0.2s'}} rows={2}/>
       <div style={{display:'flex',justifyContent:'flex-end',paddingTop:8}}><button type="submit" disabled={!replyText.trim()} style={{padding:'8px 20px',background:'#ff3333',border:'none',borderRadius:9999,color:'white',fontWeight:700,cursor:'pointer',fontSize:'0.9rem',fontFamily:'Inter',opacity:replyText.trim()?1:0.5,transition:'opacity 0.2s'}}>Reply</button></div>
     </form>
     {replies.map(function(r){return <PostCard key={r.id} p={r} doLike={doLike} doDislike={doDislike} doRepost={doRepost} loadPost={loadPost} loadProfile={loadProfile} currentUser={currentUser} doDelete={doDelete}/>})}
   </>;
 }

function ProfileView({profile,posts,user,doLike,doDislike,doRepost,loadPost,loadProfile,loadChat,loadFollowers,loadFollowing,onBack,onEdit,doDelete}){
   var own=user&&user.username===profile.username;
   return <>
     <div style={{padding:'12px 16px',borderBottom:'1px solid #eff3f4',position:'sticky',top:0,background:'rgba(255,255,255,0.85)',backdropFilter:'blur(12px)',zIndex:10}}>
       <span style={{color:'#ff3333',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontWeight:500}} onClick={onBack}><Icon name="back" size={18}/> Back</span>
       <h3 style={{margin:'8px 0 0',fontFamily:'Inter',fontWeight:700,color:'#0f1419'}}>{profile.display_name}</h3>
       <span style={{color:'#536471',fontSize:'0.8rem'}}>{profile.posts||0} whispers</span>
     </div>
     <div style={{height:200,background:profile.banner?'url('+profile.banner+') center/cover':'linear-gradient(135deg,#ff3333,rgba(255,51,51,0.2))',borderRadius:0}}/>
     <div style={{padding:'12px 16px',background:'#ffffff'}}>
       <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
         <div style={{width:80,height:80,borderRadius:'50%',border:'4px solid #ffffff',background:profile.profile_pic?'url('+profile.profile_pic+') center/cover':'#eff3f4',marginTop:-40,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',fontWeight:700,color:'#ff3333',overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>{!profile.profile_pic&&(profile.display_name?profile.display_name[0]:'?')}</div>
         <div style={{marginTop:8,display:'flex',gap:8}}>
           {own
             ? <button onClick={onEdit} style={{padding:'8px 20px',background:'#ffffff',border:'1px solid #dcddde',borderRadius:9999,color:'#0f1419',fontWeight:600,cursor:'pointer',fontFamily:'Inter',transition:'background 0.2s'}}>Edit Profile</button>
             : <>
                 <button onClick={function(){loadChat(profile.id)}} style={{padding:'8px 16px',background:'#ffffff',border:'1px solid #dcddde',borderRadius:9999,color:'#0f1419',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontFamily:'Inter',transition:'background 0.2s'}}><Icon name="mail" size={16}/> Message</button>
                 <button onClick={function(){doFollow(profile.username)}} style={{padding:'8px 20px',background:profile.isFollowing?'transparent':'#ff3333',border:'1px solid #ff3333',borderRadius:9999,color:profile.isFollowing?'#ff3333':'white',fontWeight:700,cursor:'pointer',fontFamily:'Inter',transition:'all 0.2s'}}>{profile.isFollowing?'Following':'Follow'}</button>
               </>
           }
         </div>
       </div>
       <div style={{fontWeight:800,fontSize:'1.3rem',marginTop:8,color:'#0f1419'}}>{profile.display_name}</div>
       <div style={{color:'#536471'}}>@{profile.username}</div>
       {profile.bio&&<div style={{marginTop:8,lineHeight:1.5,color:'#0f1419'}}>{profile.bio}</div>}
       <div style={{display:'flex',gap:20,marginTop:12}}>
         <span style={{color:'#536471',fontSize:'0.9rem',cursor:'pointer',fontWeight:500}} onClick={function(){loadFollowing(profile.username)}}><strong style={{color:'#0f1419'}}>{profile.following||0}</strong> <span style={{color:'#536471'}}>Following</span></span>
         <span style={{color:'#536471',fontSize:'0.9rem',cursor:'pointer',fontWeight:500}} onClick={function(){loadFollowers(profile.username)}}><strong style={{color:'#0f1419'}}>{profile.followers||0}</strong> <span style={{color:'#536471'}}>Followers</span></span>
       </div>
     </div>
     {posts.map(function(p){return <PostCard key={p.id} p={p} doLike={doLike} doDislike={doDislike} doRepost={doRepost} loadPost={loadPost} loadProfile={loadProfile} currentUser={user} doDelete={doDelete}/>})}
     {posts.length===0&&<div style={{textAlign:'center',padding:60,color:'#536471',fontFamily:'Inter'}}>No whispers yet.</div>}
   </>;
 }

function NotifsView({notifs,loadProfile}){
   var ic={like:'heartFilled',follow:'user',reply:'reply',repost:'repost'};
   var cl={like:'#ff3333',follow:'#7289da',reply:'#ff3333',repost:'#00c853'};
   var mg={like:'echoed your whisper',follow:'started haunting you',reply:'replied to your whisper',repost:'resurfaced your whisper'};
   return <>
     <div style={{padding:'12px 16px',borderBottom:'1px solid #eff3f4'}}><h3 style={{margin:0,fontFamily:'Inter',fontWeight:700,color:'#0f1419'}}>Notifications</h3></div>
     {notifs.map(function(n){return <div key={n.id} style={{display:'flex',gap:12,padding:16,borderBottom:'1px solid #eff3f4',cursor:'pointer',transition:'background 0.2s'}} onClick={function(){loadProfile(n.username)}}>
       <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,51,51,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name={ic[n.type]||'heart'} size={16} color={cl[n.type]||'#ff3333'}/></div>
       <div><strong style={{color:'#0f1419'}}>{n.display_name}</strong> {mg[n.type]||'interacted'}<div style={{color:'#536471',fontSize:'0.8rem'}}>{fmt(n.created_at)}</div></div>
     </div>})}
     {notifs.length===0&&<div style={{textAlign:'center',padding:60,color:'#536471',fontFamily:'Inter'}}>The void is silent.</div>}
   </>;
 }

function MsgsView({convos,loadChat}){
   return <>
     <div style={{padding:'12px 16px',borderBottom:'1px solid #eff3f4'}}><h3 style={{margin:0,fontFamily:'Inter',fontWeight:700,color:'#0f1419'}}>Messages</h3></div>
     {convos.map(function(c){return <div key={c.other_user_id} style={{display:'flex',gap:12,padding:16,borderBottom:'1px solid #eff3f4',cursor:'pointer',alignItems:'center',transition:'background 0.2s'}} onClick={function(){loadChat(c.other_user_id)}}>
       <div style={{width:48,height:48,borderRadius:'50%',background:'#eff3f4',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#ff3333',border:'2px solid #eff3f4',fontFamily:'Inter',fontSize:'1.1rem'}}>{c.display_name?c.display_name[0]:'?'}</div>
       <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:'#0f1419'}}>{c.display_name}</div><div style={{color:'#536471',fontSize:'0.85rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.last_message}</div></div>
       {c.unread_count>0&&<span style={{background:'#ff3333',color:'white',fontSize:'0.75rem',fontWeight:700,padding:'2px 8px',borderRadius:9999}}>{c.unread_count}</span>}
     </div>})}
     {convos.length===0&&<div style={{textAlign:'center',padding:60,color:'#536471',fontFamily:'Inter'}}>No conversations yet.</div>}
   </>;
 }

function ChatView({chatUser,msgs,user,msgText,setMsgText,sendMsg,chatImg,setChatImg,setChatImgFile,handleChatImg,chatFileRef,uploading,onBack}){
   var isImg=function(s){return s&&(s.startsWith('data:')||s.match(/\.(jpg|jpeg|png|gif|webp)$/i))};
   var renderContent=function(content){
     if(!content)return null;
     var parts=content.split(/(data:[^ ]+|https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi);
     return parts.map(function(part,i){
       if(isImg(part)){return <img key={i} src={part} alt="" style={{maxWidth:'100%',maxHeight:200,borderRadius:12,display:'block',marginTop:4}} onError={function(e){e.target.style.display='none'}}/>}
       return <span key={i}>{part}</span>;
     });
   };
   return <>
     <div style={{padding:'12px 16px',borderBottom:'1px solid #eff3f4',background:'rgba(255,255,255,0.85)',backdropFilter:'blur(12px)'}}><span style={{color:'#ff3333',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontWeight:500}} onClick={onBack}><Icon name="back" size={18}/> Back</span><h3 style={{margin:'8px 0 0',fontFamily:'Inter',fontWeight:700,color:'#0f1419'}}>{chatUser.display_name}</h3></div>
     <div style={{padding:16,display:'flex',flexDirection:'column',gap:8,maxHeight:'calc(100vh - 140px)',overflowY:'auto',background:'#ffffff'}}>
       {msgs.map(function(m){return <div key={m.id} style={{alignSelf:m.sender_id===user.id?'flex-end':'flex-start',background:m.sender_id===user.id?'#ff3333':'#f7f9fa',padding:'10px 14px',borderRadius:m.sender_id===user.id?'18px 18px 4px 18px':'18px 18px 18px 4px',maxWidth:'70%',color:m.sender_id===user.id?'white':'#0f1419',fontFamily:'Inter',fontSize:'0.9rem'}}}>{renderContent(m.content)}<div style={{fontSize:'0.7rem',opacity:0.6,marginTop:2,color:m.sender_id===user.id?'rgba(255,255,255,0.7)':'#536471'}}>{m.created_at?new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):''}</div></div>})}
     </div>
     <form onSubmit={sendMsg} style={{padding:16,borderTop:'1px solid #eff3f4',background:'#ffffff'}}>
       {chatImg&&<div style={{marginBottom:8,position:'relative',display:'inline-block'}}><img src={chatImg} alt="" style={{maxHeight:100,borderRadius:12,border:'1px solid #dcddde'}}/><div onClick={function(){setChatImg('');setChatImgFile(null)}} style={{position:'absolute',top:-8,right:-8,width:24,height:24,borderRadius:'50%',background:'#ffffff',border:'1px solid #dcddde',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}}><Icon name="x" size={14}/></div></div>}
       <div style={{display:'flex',gap:8,alignItems:'center'}}>
         <div onClick={function(){chatFileRef&&chatFileRef.current&&chatFileRef.current.click()}} style={{padding:8,borderRadius:'50%',cursor:'pointer',color:'#ff3333',transition:'background 0.2s'}}><Icon name="image" size={20}/></div>
         <input ref={chatFileRef} type="file" accept="image/*" onChange={handleChatImg} style={{display:'none'}}/>
         <input value={msgText} onChange={function(e){setMsgText(e.target.value)}} placeholder="Type a message..." style={{...inpStyle,margin:0,flex:1,background:'#eff3f4',color:'#0f1419'}}/>
         <button type="submit" disabled={(!msgText.trim()&&!chatImg)||uploading} style={{padding:'10px 20px',background:'#ff3333',border:'none',borderRadius:9999,color:'white',fontWeight:700,cursor:'pointer',fontFamily:'Inter',opacity:(msgText.trim()||chatImg)?1:0.5,transition:'opacity 0.2s'}}>{uploading?'...':'Send'}</button>
       </div>
     </form>
   </>;
 }

function SearchView({q,setQ,doSearch,res,doLike,doDislike,doRepost,loadPost,loadProfile,currentUser,doDelete}){
   return <>

     <div style={{padding:'12px 16px',borderBottom:'1px solid #eff3f4'}}><h3 style={{margin:0,fontFamily:'Inter',fontWeight:700,color:'#0f1419'}}>Explore</h3></div>
     <form onSubmit={doSearch} style={{padding:'12px 16px',borderBottom:'1px solid #eff3f4'}}><input value={q} onChange={function(e){setQ(e.target.value)}} placeholder="Search whispers, users..." style={{...inpStyle,margin:0,borderRadius:9999,background:'#eff3f4',color:'#0f1419',border:'1px solid transparent'}}/></form>
     {res.users&&res.users.map(function(u){return <div key={u.id} style={{display:'flex',gap:12,padding:'12px 16px',borderBottom:'1px solid #eff3f4',cursor:'pointer',alignItems:'center',transition:'background 0.2s'}} onClick={function(){loadProfile(u.username)}}>
       <div style={{width:44,height:44,borderRadius:'50%',background:'#eff3f4',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#ff3333',border:'2px solid #eff3f4',fontFamily:'Inter',fontSize:'1rem'}}>{u.display_name?u.display_name[0]:'?'}</div>
       <div><div style={{fontWeight:700,color:'#0f1419'}}>{u.display_name}</div><div style={{color:'#536471',fontSize:'0.85rem'}}>@{u.username}</div></div>
     </div>})}
     {res.posts&&res.posts.map(function(p){return <PostCard key={p.id} p={p} doLike={doLike} doDislike={doDislike} doRepost={doRepost} loadPost={loadPost} loadProfile={loadProfile} currentUser={currentUser} doDelete={doDelete}/>})}
     {q&&(!res.users||res.users.length===0)&&(!res.posts||res.posts.length===0)&&<div style={{textAlign:'center',padding:60,color:'#536471',fontFamily:'Inter'}}>Nothing found.</div>}
   </>;
 }

function EditView({form,setForm,onSave,saved,onBack}){
   function upd(f,v){var n={};for(var k in form)n[k]=form[k];n[f]=v;setForm(n)}
   return <>
     <div style={{padding:'12px 16px',borderBottom:'1px solid #eff3f4',position:'sticky',top:0,background:'rgba(255,255,255,0.85)',backdropFilter:'blur(12px)',zIndex:10}}><span style={{color:'#ff3333',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontWeight:500}} onClick={onBack}><Icon name="back" size={18}/> Back</span><h3 style={{margin:'8px 0 0',fontFamily:'Inter',fontWeight:700,color:'#0f1419'}}>Edit Profile</h3></div>
     <form onSubmit={onSave} style={{padding:20,fontFamily:'Inter'}}>
       <div style={{marginBottom:20}}><label style={{display:'block',color:'#536471',fontSize:'0.85rem',fontWeight:600,marginBottom:6}}>Username</label><input value={form.username} onChange={function(e){upd('username',e.target.value.replace(/[^a-zA-Z0-9_]/g,''))}} style={{...inpStyle,marginBottom:8,background:'#eff3f4',color:'#0f1419'}} minLength={3} maxLength={30} placeholder="username"/>{form.username&&<div style={{color:'#536471',fontSize:'0.8rem',marginTop:4}}>creepster.io/@{form.username}</div>}</div>
       <div style={{marginBottom:20}}><label style={{display:'block',color:'#536471',fontSize:'0.85rem',fontWeight:600,marginBottom:6}}>Display Name</label><input value={form.display_name} onChange={function(e){upd('display_name',e.target.value)}} style={{...inpStyle,marginBottom:8,background:'#eff3f4',color:'#0f1419'}} maxLength={50}/></div>
       <div style={{marginBottom:20}}><label style={{display:'block',color:'#536471',fontSize:'0.85rem',fontWeight:600,marginBottom:6}}>Bio</label><textarea value={form.bio} onChange={function(e){upd('bio',e.target.value)}} style={{...inpStyle,resize:'vertical',minHeight:80,marginBottom:8,background:'#eff3f4',color:'#0f1419'}} rows={3} maxLength={160}/></div>
       <div style={{marginBottom:20}}><label style={{display:'block',color:'#536471',fontSize:'0.85rem',fontWeight:600,marginBottom:6}}>Profile Picture URL</label><input value={form.profile_pic} onChange={function(e){upd('profile_pic',e.target.value)}} style={{...inpStyle,marginBottom:8,background:'#eff3f4',color:'#0f1419'}} placeholder="https://example.com/avatar.jpg"/>{form.profile_pic&&<div style={{marginTop:8}}><img src={form.profile_pic} alt="" style={{width:60,height:60,borderRadius:'50%',objectFit:'cover',border:'2px solid #eff3f4'}} onError={function(e){e.target.style.display='none'}}/></div>}</div>
       <div style={{marginBottom:20}}><label style={{display:'block',color:'#536471',fontSize:'0.85rem',fontWeight:600,marginBottom:6}}>Banner URL</label><input value={form.banner} onChange={function(e){upd('banner',e.target.value)}} style={{...inpStyle,marginBottom:8,background:'#eff3f4',color:'#0f1419'}} placeholder="https://example.com/banner.jpg"/>{form.banner&&<div style={{marginTop:8,height:100,borderRadius:12,background:'url('+form.banner+') center/cover',border:'1px solid #eff3f4'}}/>}</div>
       <div style={{display:'flex',gap:12}}><button type="submit" style={{padding:'10px 24px',background:'#ff3333',border:'none',borderRadius:9999,color:'white',fontWeight:700,cursor:'pointer',fontFamily:'Inter',transition:'background 0.2s'}}>Save</button><button type="button" onClick={onBack} style={{padding:'10px 24px',background:'transparent',border:'1px solid #dcddde',borderRadius:9999,color:'#0f1419',fontWeight:600,cursor:'pointer',fontFamily:'Inter'}}>Cancel</button></div>
       {saved&&<div style={{marginTop:12,color:'#00c853',fontWeight:500}}>Profile updated!</div>}
     </form>
   </>;
 }

function UserListView({title,users,onBack,loadProfile,doFollow,currentUser}){
   return <>
     <div style={{padding:'12px 16px',borderBottom:'1px solid #eff3f4',position:'sticky',top:0,background:'rgba(255,255,255,0.85)',backdropFilter:'blur(12px)',zIndex:10}}>
       <span style={{color:'#ff3333',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontWeight:500}} onClick={onBack}><Icon name="back" size={18}/> Back</span>
       <h3 style={{margin:'8px 0 0',fontFamily:'Inter',fontWeight:700,color:'#0f1419'}}>{title}</h3>
     </div>
     {users.map(function(u){
       var isOwn=currentUser&&currentUser.username===u.username;
       return <div key={u.id} style={{display:'flex',gap:12,padding:'12px 16px',borderBottom:'1px solid #eff3f4',alignItems:'center',transition:'background 0.2s'}}>
         <div style={{width:44,height:44,borderRadius:'50%',background:u.profile_pic?'url('+u.profile_pic+') center/cover':'#eff3f4',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#ff3333',border:'2px solid #eff3f4',cursor:'pointer',flexShrink:0,overflow:'hidden'}} onClick={function(){loadProfile(u.username)}}>
           {!u.profile_pic&&(u.display_name?u.display_name[0]:'?')}
         </div>
         <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={function(){loadProfile(u.username)}}>
           <div style={{fontWeight:700,color:'#0f1419'}}>{u.display_name}</div>
           <div style={{color:'#536471',fontSize:'0.85rem'}}>@{u.username}</div>
           {u.bio&&<div style={{color:'#536471',fontSize:'0.8rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:2}}>{u.bio}</div>}
         </div>
         {!isOwn&&<button onClick={function(){doFollow(u.username)}} style={{padding:'6px 16px',background:u.isFollowing?'transparent':'#ff3333',border:u.isFollowing?'1px solid #dcddde':'1px solid #ff3333',borderRadius:9999,color:u.isFollowing?'#536471':'white',fontWeight:700,cursor:'pointer',fontSize:'0.85rem',fontFamily:'Inter',flexShrink:0,transition:'all 0.2s'}}>{u.isFollowing?'Following':'Follow'}</button>}
       </div>;
     })}
     {users.length===0&&<div style={{textAlign:'center',padding:60,color:'#536471',fontFamily:'Inter'}}>{title==='Followers'?'No followers yet.':'Not following anyone yet.'}</div>}
   </>;
 }

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
