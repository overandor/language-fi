# MEMBRA Artifact Verification Service

Audio/video artifact verification system with IPFS hosting and oracle integration for the MEMBRA tokenomics platform.

## Features

- **IPFS Content Addressing**: Automatic upload to IPFS via Pinata or local node
- **Content Verification**: Cryptographic verification of artifact integrity
- **Fraud Detection**: Perceptual hashing for duplicate detection
- **Oracle Integration**: Integration with language-fi oracle for cryptographic attestation
- **Provenance Tracking**: Complete provenance records for each artifact
- **REST API**: Easy-to-use REST API for integration

## Architecture

```
Audio/Video File → Artifact Analyzer → IPFS Upload → Provenance Attestation → Oracle Verification → Tokenomics Integration
```

## Installation

```bash
cd /Users/alep/Downloads/language-fi/apps/artifact-service
pip install -r requirements.txt
```

## Configuration

Set environment variables:

```bash
export IPFS_GATEWAY="https://ipfs.io/ipfs/"
export PINATA_API_KEY="your_pinata_api_key"
export PINATA_SECRET_API_KEY="your_pinata_secret"
export ORACLE_ENDPOINT="http://localhost:8000"
```

## Usage

### Start the API Server

```bash
python artifact_api.py
```

The server will start on `http://localhost:8001`

### API Endpoints

#### Upload Artifact

```bash
POST /api/artifacts/upload
Content-Type: multipart/form-data

Parameters:
- file: Audio/video file
- creator_wallet: Wallet address of creator
- metadata: JSON string with optional metadata

Response:
{
  "attestation_id": "abc123...",
  "ipfs_cid": "QmXxx...",
  "content_hash": "sha256...",
  "verification_status": "verified",
  "oracle_signature": "0xabc...",
  "artifact_type": "audio",
  "size_bytes": 12345,
  "created_at": 1716123456.789
}
```

#### Get Artifact

```bash
GET /api/artifacts/{attestation_id}
```

#### Verify Artifact

```bash
POST /api/artifacts/{attestation_id}/verify
```

#### List Artifacts

```bash
GET /api/artifacts?artifact_type=audio&creator_wallet=xxx&limit=50
```

#### Check Uniqueness

```bash
POST /api/artifacts/check-uniqueness
Content-Type: multipart/form-data

Parameters:
- file: Audio/video file to check

Response:
{
  "is_unique": true,
  "message": "Artifact is unique"
}
```

#### Get IPFS Content

```bash
GET /api/artifacts/ipfs/{cid}
```

## Integration with Tokenomics

The artifact verification service integrates with the MEMBRA tokenomics system:

1. **Provenance Attestation**: Each artifact gets a cryptographic attestation
2. **Oracle Verification**: Language-fi oracle provides additional verification
3. **Market Cap Calculation**: Artifacts contribute to token appraisal via novelty/rarity scores
4. **Merkle Tree Integration**: Attestations can be included in Merkle trees for batch verification

## Example Usage

### Python Client

```python
import requests

# Upload an artifact
with open("my_audio.mp3", "rb") as f:
    files = {"file": f}
    data = {
        "creator_wallet": "MyWalletAddress",
        "metadata": json.dumps({"title": "My Audio", "description": "Description"})
    }
    
    response = requests.post(
        "http://localhost:8001/api/artifacts/upload",
        files=files,
        data=data
    )
    
    attestation = response.json()
    print(f"Artifact ID: {attestation['attestation_id']}")
    print(f"IPFS CID: {attestation['ipfs_cid']}")
```

### JavaScript/TypeScript Client

```typescript
const formData = new FormData();
formData.append('file', audioFile);
formData.append('creator_wallet', 'MyWalletAddress');
formData.append('metadata', JSON.stringify({title: 'My Audio'}));

const response = await fetch('http://localhost:8001/api/artifacts/upload', {
  method: 'POST',
  body: formData
});

const attestation = await response.json();
console.log('Artifact ID:', attestation.attestation_id);
```

## Security Considerations

- **Private Keys**: Never commit PINATA API keys to git
- **Content Validation**: All files are validated for type and size
- **Fraud Detection**: Perceptual hashing prevents duplicate uploads
- **Oracle Verification**: Additional cryptographic verification from language-fi oracle

## Supported Formats

### Audio
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- M4A (.m4a)
- FLAC (.flac)

### Video
- MP4 (.mp4)
- AVI (.avi)
- MOV (.mov)
- MKV (.mkv)
- WebM (.webm)

## Troubleshooting

### IPFS Upload Fails

If Pinata is not configured, the system falls back to local IPFS node (localhost:5001). If both are unavailable, a mock CID is generated for testing.

### Oracle Connection Fails

The system will continue to function without oracle verification, but attestations won't have oracle signatures. Check that the oracle endpoint is accessible.

### Duplicate Detection

If you need to upload similar content, modify the file slightly to change the perceptual hash.

## Production Deployment

For production deployment:

1. Use Pinata for reliable IPFS pinning
2. Configure oracle endpoint for cryptographic verification
3. Set up proper authentication/authorization
4. Configure rate limiting
5. Set up monitoring and logging
6. Use HTTPS for all endpoints

## License

MIT