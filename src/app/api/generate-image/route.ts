import { NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";

// Ensure the FAL_KEY is set in the environment
// @fal-ai/serverless-client picks up FAL_KEY from process.env automatically

export async function POST(req: Request) {
    try {
        const { name, description, toppings } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        if (!process.env.FAL_KEY) {
            console.error('FAL_KEY is missing from environment variables');
            return NextResponse.json({ error: 'FAL_KEY is not configured on the server' }, { status: 500 });
        }

        // Construct the prompt
        const toppingList = toppings && toppings.length > 0
            ? `Topped with ${toppings.join(', ')}.`
            : '';

        const prompt = `High-end food photography of a single square CORNER SLICE from a 10x14 inch Detroit-style pizza, viewed from a 45-degree angle. Features a 1-inch thick airy crust. Two adjacent sides have a tall, crispy dark 'frico' cheese wall (corner piece), while the other two sides show the soft interior crumb structure. Toppings: ${toppingList}. Description: ${name}, ${description || ''}. Pitch black background, professional kitchen lighting, 8k resolution, photorealistic.`;

        console.log('Generating image with prompt:', prompt);
        console.log('Using @fal-ai/serverless-client with Imagen 4');

        const result: any = await fal.subscribe("fal-ai/imagen4/preview/fast", {
            input: {
                prompt,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map((log) => log.message).forEach(console.log);
                }
            },
        });

        // Hacking response handling for potential structure differences
        const images = result.images || (result.data && result.data.images);

        if (images && images.length > 0) {
            return NextResponse.json({ url: images[0].url });
        } else {
            console.error('Fal.ai Result:', JSON.stringify(result, null, 2));
            throw new Error('No image generated (check logs)');
        }

    } catch (error: any) {
        console.error('Fal.ai Generation Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to generate image',
            details: error.body || error
        }, { status: 500 });
    }
}
