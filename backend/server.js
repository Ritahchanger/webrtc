const WebSocket = require("ws");

const wss = new WebSocket.Server({port:8080});





wss.on("connection",ws=>{

    ws.on("message",message=>{

        wss.clients.forEach(client=>{

            if(client !== ws && client.readyState === WebSocket.open){

                client.send(message);

            }

        })

    })


})






console.log("Websocket server running on ws://localhost:8080")