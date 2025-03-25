const signalingServer = new WebSocket("ws://localhost:8080");

const peerConnection = new RTCPeerConnection();


const constraints = { video:true, audio:true }


navigator.mediaDevices.getUserMedia(constraints)
.then(stream=>{

    document.getElementById('localVideo').srcObject = stream;

    stream.getTracks().forEach((track)=>{


        peerConnection.addTrack(track,stream);

    });


    peerConnection.ontrack = event => {

        document.getElementById("remoteVideo").srcObject = event.streams[0];

    }

    signalingServer.onmessage = async message =>{

        const data = JSON.parse(message.data);

        if(data.offer){

            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

            const answer = await peerConnection.createAnswer();

            await peerConnection.setLocalDescription(answer);


            signalingServer.send(JSON.stringify({answer}));

        }

        if(data.answer){

            await peerConnection.setRemoteDescription(new RTCIceCandidate(data.answer));

        }


        if(data.iceCandidate){

            await peerConnection.addIceCandidate(new RTCIceCandidate(data.iceCandidate));

        }

    }


    peerConnection.onicecandidate = event =>{

        if(event.candidate){

            signalingServer.send(JSON.stringify({iceCandidate:event.candidate}));

        }

    }




    document.getElementById('startCall').onclick = async () =>{


        const offer = await peerConnection.createOffer();


        await peerConnection.setLocalDescription(offer);

        signalingServer.send(JSON.stringify({offer}));


    }

})