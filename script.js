const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));
document.querySelector('#year').textContent = new Date().getFullYear();

(() => {
  const message = document.querySelector('#auth-message');
  const forms = document.querySelector('#account-forms');
  const sessionPanel = document.querySelector('#account-session');
  const signedInEmail = document.querySelector('#signed-in-email');
  const signupForm = document.querySelector('#signup-form');
  const signinForm = document.querySelector('#signin-form');
  const signoutButton = document.querySelector('#signout-button');
  const config = window.HDMI_SUPABASE_CONFIG;

  const setMessage = (text, isError = false) => {
    message.textContent = text;
    message.style.color = isError ? '#ff9b9b' : '#8fcfff';
  };
  const setBusy = (form, busy) => {
    form.querySelector('button[type="submit"]').disabled = busy;
  };

  if (!config || !config.url || !config.publishableKey ||
      config.url.includes('PASTE_') || config.publishableKey.includes('PASTE_')) {
    setMessage('The account forms are installed. The Supabase Project URL and Publishable key still need to be added to config.js.');
    return;
  }
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    setMessage('The account service could not load. Please refresh and try again.', true);
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });

  const subscriberCount = document.querySelector('#subscriber-count');
  const subscriberBox = subscriberCount?.parentElement;
  const counterSection = subscriberBox?.parentElement;
  let refreshing = false;
  const readSettings = () => client.from('site_settings').select('subscriber_mode,subscriber_goal,custom_message').eq('id',1).single();
  const refreshSubscribers = async () => {
    if (refreshing || document.hidden || !subscriberBox) return;
    refreshing = true;
    try {
      const {data:s,error} = await readSettings();
      if (error || !s) throw Error('Settings unavailable');
      subscriberBox.style.display = s.subscriber_mode === 'hidden' ? 'none' : '';
      if (counterSection.children[1]) counterSection.children[1].style.display = s.subscriber_mode === 'hidden' ? 'none' : '';
      const label = subscriberBox.querySelector('small');
      if (s.subscriber_mode === 'goal') {
        subscriberCount.textContent = Number(s.subscriber_goal).toLocaleString();
        label.textContent = 'Road to this fan goal';
      } else if (s.subscriber_mode === 'custom') {
        subscriberCount.textContent = s.custom_message;
        label.textContent = 'Announcement';
      } else if (s.subscriber_mode === 'live') {
        const {data,error:countError} = await client.rpc('get_subscriber_count');
        const count = Number(data);
        subscriberCount.textContent = !countError && data !== null && Number.isSafeInteger(count) && count >= 0 ? count.toLocaleString() : '—';
        label.textContent = 'Subscribers';
      }
    } catch {
      subscriberBox.style.display = 'none';
      if (counterSection.children[1]) counterSection.children[1].style.display = 'none';
    } finally { refreshing = false; }
  };
  refreshSubscribers();
  setInterval(refreshSubscribers,60000);
  document.addEventListener('visibilitychange',refreshSubscribers);

  let libraryVersion = 0;
  let libraryUser;
  const refreshLibrary = (user) => {
    const panel = document.querySelector('#fan-library');
    if (!panel) return;
    const uid = user?.id || null;
    if (libraryUser === uid) return;
    libraryUser = uid;
    const version = ++libraryVersion;
    panel.querySelectorAll('audio').forEach(a => { a.pause(); a.removeAttribute('src'); a.load(); });
    panel.textContent = uid ? 'Loading your music…' : 'Sign in to access your purchased music.';
    if (!uid) return;
    setTimeout(async () => {
      try {
        const {data,error} = await client.rpc('get_my_music');
        if (version !== libraryVersion) return;
        if (error) throw error;
        panel.replaceChildren();
        if (!data.length) { panel.textContent = 'Your library is empty. Purchased songs will appear here.'; return; }
        for (const track of data) {
          const item = document.createElement('div');
          item.style.cssText = 'width:100%;padding:12px 0';
          const title = document.createElement('strong'); title.textContent = track.title;
          const play = document.createElement('button'); play.type='button'; play.className='button button-wide'; play.textContent='PLAY TRACK';
          const audio = document.createElement('audio'); audio.controls=true; audio.preload='none'; audio.hidden=true; audio.style.width='100%'; audio.setAttribute('controlsList','nodownload'); audio.setAttribute('disablePictureInPicture','');
          const status = document.createElement('small'); status.setAttribute('role','status');
          play.addEventListener('click', async () => {
            play.disabled=true; status.textContent='Preparing playback…';
            try {
              const {data:link,error} = await client.storage.from('purchased-music').createSignedUrl(track.audio_path,600);
              if(version!==libraryVersion)return;
              if(error||!link?.signedUrl)throw Error('Playback unavailable');
              audio.src=link.signedUrl; audio.hidden=false; status.textContent='Press play on the audio player. Reload track if the link expires.';
              play.textContent='RELOAD TRACK';
            } catch { if(version===libraryVersion)status.textContent='Unable to load track. Please try again.'; }
            finally {play.disabled=false;}
          });
          item.append(title,play,audio,status); panel.append(item);
        }
      } catch { if(version===libraryVersion){panel.textContent='Library temporarily unavailable. Refresh to try again.';libraryUser=undefined;} }
    },0);
  };

  const showSession = (user) => {
    refreshLibrary(user);
    const signedIn = Boolean(user);
    forms.hidden = signedIn;
    sessionPanel.hidden = !signedIn;
    signedInEmail.textContent = signedIn ? user.email : '';
    if (signedIn) setMessage('You are signed in. Visit My Music to access your library.');
  };

  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = signupForm.elements.email.value.trim();
    const password = signupForm.elements.password.value;
    setBusy(signupForm, true);
    setMessage('Creating your fan account…');
    const { data, error } = await client.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.href.split('#')[0] }
    });
    setBusy(signupForm, false);
    if (error) return setMessage(error.message, true);
    if (data.session) {
      showSession(data.user);
      setMessage('Your fan account is ready. You are signed in.');
    } else {
      setMessage('Registration received. Check your email for the confirmation link before signing in.');
      signupForm.reset();
    }
  });

  signinForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = signinForm.elements.email.value.trim();
    const password = signinForm.elements.password.value;
    setBusy(signinForm, true);
    setMessage('Signing in…');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    setBusy(signinForm, false);
    if (error) return setMessage(error.message, true);
    showSession(data.user);
    setMessage('You are signed in. Visit My Music to access your library.');
    signinForm.reset();
  });

  signoutButton.addEventListener('click', async () => {
    signoutButton.disabled = true;
    const { error } = await client.auth.signOut();
    signoutButton.disabled = false;
    if (error) return setMessage(error.message, true);
    showSession(null);
    setMessage('You have been signed out.');
  });

  client.auth.getSession().then(({ data, error }) => {
    if (error) setMessage(error.message, true);
    else showSession(data.session?.user || null);
  });
  client.auth.onAuthStateChange((_event, session) => showSession(session?.user || null));
})();