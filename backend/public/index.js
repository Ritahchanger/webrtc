const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startCallBtn = document.getElementById("startCall");

const ws = new WebSocket("ws://localhost:8080");

let peerConnection;
let localStream;


const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};



async function getLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
    } catch (error) {
        console.error("Error accessing camera/microphone.", error);
    }
}


function createPeerConnection() {
    peerConnection = new RTCPeerConnection(config);

    
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });


    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
        }
    };

   
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };
}


ws.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    if (data.type === "offer") {
        console.log("Received offer, creating answer...");
        createPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", answer }));
    } else if (data.type === "answer") {
        console.log("Received answer, setting remote description...");
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } else if (data.type === "candidate") {
        console.log("Received ICE candidate...");
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
};


startCallBtn.addEventListener("click", async () => {
    await getLocalStream();
    createPeerConnection();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    ws.send(JSON.stringify({ type: "offer", offer }));
});
