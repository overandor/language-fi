"""
Hugging Face Space Application
Gradio interface for artifact analysis and minting
"""

import gradio as gr
import asyncio
from ingestion import ArtifactIngestionService
from oracle import OracleAttestationAPI
from gating import get_gating_service

# Initialize services
ingestion_service = ArtifactIngestionService()
oracle_api = OracleAttestationAPI()
gating_service = get_gating_service()


def analyze_artifact(image, wallet_address):
    """
    Analyze artifact image and return results
    """
    if image is None:
        return None, "Please upload an image", None
    
    if not wallet_address:
        return None, "Please enter a wallet address", None
    
    try:
        # Convert image to bytes
        import io
        
        # Save image to bytes
        img_bytes = io.BytesIO()
        image.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        image_data = img_bytes.read()
        
        # Process artifact (run async in sync context)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        analysis = loop.run_until_complete(ingestion_service.process_artifact(image_data, wallet_address))
        loop.close()
        
        # Generate attestation
        attestation = oracle_api.create_attestation({
            "cid": analysis.cid,
            "score": analysis.score,
            "mint_amount": analysis.mint_amount
        })
        
        # Format results
        results = f"""
        **CID**: {analysis.cid}
        **Confidence**: {analysis.confidence:.2%}
        **Denomination**: ${analysis.denomination if analysis.denomination else 'N/A'}
        **Year**: {analysis.year if analysis.year else 'N/A'}
        **Protocol Score**: {analysis.score:.1f}
        **Mint Amount**: {analysis.mint_amount:.1f} LGU
        **Status**: {'✓ Ready to Mint' if not analysis.is_duplicate else '✗ Duplicate'}
        """
        
        return image, results, attestation
    
    except Exception as e:
        return image, f"Error: {str(e)}", None


def get_wallet_stats(wallet_address):
    """
    Get wallet statistics
    """
    if not wallet_address:
        return "Please enter a wallet address"
    
    try:
        stats = gating_service.get_wallet_stats(wallet_address)
        return f"""
        **Daily Mints**: {stats['daily_mints']:.1f} LGU
        **Weekly Mints**: {stats['weekly_mints']:.1f} LGU
        **Daily Submissions**: {stats['daily_submissions']}
        **Daily Remaining**: {stats['daily_remaining']:.1f} LGU
        **Weekly Remaining**: {stats['weekly_remaining']:.1f} LGU
        **Submissions Remaining**: {stats['submissions_remaining']}
        """
    except Exception as e:
        return f"Error: {str(e)}"


# Create Gradio interface
with gr.Blocks(title="LGU Artifact Minting", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# LGU Artifact Minting - Proof-of-Value System")
    gr.Markdown("Upload an artifact image to analyze and mint LGU tokens")
    
    with gr.Tab("Analyze & Mint"):
        with gr.Row():
            with gr.Column():
                image_input = gr.Image(label="Upload Artifact Image", type="pil")
                wallet_input = gr.Textbox(label="Wallet Address", placeholder="0x...")
                analyze_btn = gr.Button("Analyze Artifact", variant="primary")
            
            with gr.Column():
                output_image = gr.Image(label="Preview")
                output_text = gr.Markdown(label="Analysis Results")
                attestation_output = gr.JSON(label="Oracle Attestation")
        
        analyze_btn.click(
            fn=analyze_artifact,
            inputs=[image_input, wallet_input],
            outputs=[output_image, output_text, attestation_output]
        )
    
    with gr.Tab("Wallet Stats"):
        wallet_stats_input = gr.Textbox(label="Wallet Address", placeholder="0x...")
        stats_btn = gr.Button("Get Stats")
        stats_output = gr.Markdown()
        
        stats_btn.click(
            fn=get_wallet_stats,
            inputs=wallet_stats_input,
            outputs=stats_output
        )
    
    gr.Markdown("""
    ## 🔐 Production-Safe Design
    
    This system uses a protocol score, not a dollar conversion. The LGU credits are non-redeemable 
    and usable only within the protocol for staking, fees, and boosts.
    
    **No fiat linkage** • **CID uniqueness** • **Anti-farming rules**
    """)


if __name__ == "__main__":
    demo.launch()
