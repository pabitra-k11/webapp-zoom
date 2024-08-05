const socket = io('/');
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement('video');
myVideo.muted = true;

let peer = new Peer({
    path: '/peerjs',
    host: '/',
    port: '443'
});

let myVideoStream;
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
    });

    socket.on('user-connected', (userId) => {
        connectToNewUser(userId, myVideoStream); // Pass the local stream
    });

    socket.on('createMessage', message => {
        let ul = document.querySelector('ul');
        let li = document.createElement('li');
        li.classList.add('message');
        li.innerHTML = `<b>user</b><br/>${message}`;
        ul.appendChild(li);
        scrollToBottom();
    });
});

peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
});

const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    });
}

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
};

const scrollToBottom = () => {
    let d = document.querySelector('.main_chat_window');
    d.scrollTop = d.scrollHeight;
}

// Mute/Unmute functionality
const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

const setMuteButton = () => {
    let html = `<i class="fa-solid fa-microphone"></i><span>Mute</span>`;
    document.querySelector('.main_mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
    let html = `<i class="fa-solid fa-microphone-slash"></i><span>Unmute</span>`;
    document.querySelector('.main_mute_button').innerHTML = html;
}

// Play/Stop video functionality
const playStop = () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setStopButton();
    } else {
        setPlayButton();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};

const setStopButton = () => {
    let html = `<i class="fa-solid fa-video-slash"></i><span>Stop Video</span>`;
    document.querySelector('.main_video_button').innerHTML = html;
};

const setPlayButton = () => {
    let html = `<i class="fa-solid fa-video"></i><span>Play Video</span>`;
    document.querySelector('.main_video_button').innerHTML = html;
};

// Leave meeting functionality
let btn = document.querySelector('.leave-meeting-button');
btn.addEventListener('click', () => {
    leaveMeeting();
});

const leaveMeeting = () => {
    myVideoStream.getTracks().forEach(track => track.stop());
    socket.emit('user-left', peer.id);
    peer.destroy();
    socket.disconnect();
    alert('You have left the meeting');
    
};
