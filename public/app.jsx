const { useState, useEffect, useRef } = React;

function App() {
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const wsRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket(`ws://${window.location.host}`);
    peerRef.current = new Peer();

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      streamRef.current = stream;
    });

    peerRef.current.on('open', id => {
      setPeerId(id);
      wsRef.current.send(JSON.stringify({ type: 'peer-id', id }));
    });

    peerRef.current.on('call', call => {
      call.answer(streamRef.current);
      call.on('stream', remoteStream => {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play();
      });
    });

    wsRef.current.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.type === 'peer-id' && data.id !== peerId) {
        setRemotePeerId(data.id);
      }
    };
  }, []);

  useEffect(() => {
    if (remotePeerId && streamRef.current) {
      const call = peerRef.current.call(remotePeerId, streamRef.current);
      call.on('stream', remoteStream => {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play();
      });
    }
  }, [remotePeerId]);

  return (
    <div>
      <h1>Voice Chat</h1>
      <p>Your ID: {peerId}</p>
      <p>Remote ID: {remotePeerId || 'Waiting for peer...'}</p>
      <audio ref={remoteAudioRef}></audio>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
