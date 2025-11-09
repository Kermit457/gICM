# OpenAI GPT Image MCP

AI-powered image generation with DALL-E 3 and GPT-4 Vision.

## Overview

The OpenAI GPT Image MCP provides access to OpenAI's image generation (DALL-E 3) and vision (GPT-4 Vision) capabilities. Generate images from text prompts, analyze images, and integrate AI vision into your applications.

## Installation

```bash
npm install -g @openai/image-mcp-server
```

## Environment Variables

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
OPENAI_ORG_ID=org-xxxxxxxxxxxxxxxxxxxxx  # Optional
```

Get your API key from: https://platform.openai.com/api-keys

## Features

- **DALL-E 3 Image Generation**: Create images from text descriptions
- **GPT-4 Vision**: Analyze and describe images
- **Image Editing**: Modify existing images with prompts
- **Style Control**: Vivid or natural style options
- **Multiple Sizes**: 1024x1024, 1024x1792, 1792x1024
- **Quality Settings**: Standard or HD quality
- **Batch Processing**: Generate multiple variations

## Usage Examples

### Generate Images

```typescript
import { openaiImage } from '@openai/mcp';

// Generate NFT artwork
const image = await openaiImage.generate({
  prompt: "A futuristic Solana token mascot, cyberpunk style, neon colors, 3D rendered",
  model: "dall-e-3",
  size: "1024x1024",
  quality: "hd",
  style: "vivid"
});

console.log(image.url); // Image URL
console.log(image.revisedPrompt); // AI-enhanced prompt
```

### Analyze Images with GPT-4 Vision

```typescript
// Analyze NFT metadata
const analysis = await openaiImage.analyze({
  imageUrl: "https://example.com/nft.png",
  prompt: "Describe this NFT artwork in detail. What emotions does it evoke?"
});

console.log(analysis.description);
```

### Generate Multiple Variations

```typescript
// Create logo variations
const logos = await openaiImage.generateBatch({
  prompt: "Minimalist logo for a DeFi protocol, geometric shapes",
  count: 3,
  size: "1024x1024"
});

logos.forEach((logo, i) => {
  console.log(`Variation ${i + 1}:`, logo.url);
});
```

### Edit Existing Images

```typescript
// Add elements to existing image
const edited = await openaiImage.edit({
  image: originalImageBuffer,
  mask: maskImageBuffer, // Transparent PNG indicating edit area
  prompt: "Add a golden crown floating above the character's head",
  size: "1024x1024"
});
```

## Tools Provided

- `openai_generate_image` - Generate image from prompt
- `openai_analyze_image` - Analyze image with GPT-4 Vision
- `openai_edit_image` - Edit existing image
- `openai_create_variation` - Create variation of image
- `openai_describe_image` - Get detailed image description

## Integration Patterns

**Next.js API Route:**
```typescript
export async function POST(req: Request) {
  const { prompt } = await req.json();

  const image = await openaiImage.generate({
    prompt: `${prompt}, suitable for NFT collection`,
    quality: "hd"
  });

  return Response.json({ imageUrl: image.url });
}
```

**Automated NFT Generation:**
```typescript
async function generateNFTCollection(traits: string[]) {
  const images = await Promise.all(
    traits.map(trait =>
      openaiImage.generate({
        prompt: `${trait}, digital art, collectible style`,
        model: "dall-e-3"
      })
    )
  );

  return images;
}
```

## Web3 Use Cases

- **NFT artwork generation**: Create unique NFT images
- **Token branding**: Generate token logos and mascots
- **Marketing assets**: Create social media graphics
- **Documentation**: Generate diagrams and illustrations
- **UI mockups**: Visualize interface designs
- **Community art**: Generate artwork for Discord/Twitter
- **Metaverse assets**: Create 3D-ready concept art

## Cost Optimization

**DALL-E 3 Pricing:**
- Standard (1024x1024): $0.040 per image
- Standard (1024x1792, 1792x1024): $0.080 per image
- HD (1024x1024): $0.080 per image
- HD (1024x1792, 1792x1024): $0.120 per image

**Tips:**
- Use standard quality for drafts/iterations
- Generate at smaller size first, upscale if needed
- Batch similar requests together
- Cache generated images to avoid regeneration
- Use GPT-4 Vision to validate before regenerating

## Best Practices

1. **Detailed prompts**: More specific prompts yield better results
2. **Style guidance**: Include art style, medium, mood in prompt
3. **Negative prompts**: Describe what you don't want
4. **Iterative refinement**: Start broad, refine based on results
5. **Copyright**: Generated images can be used commercially
6. **Content policy**: Follow OpenAI's usage policies

## Repository

https://github.com/openai/mcp-image-server

---

**Version:** 1.0.0
**Category:** AI Services
**Last Updated:** 2025-01-08
