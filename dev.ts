import { serve } from 'https://deno.land/std/http/mod.ts';
import { typeByExtension } from 'https://deno.land/std@0.179.0/media_types/mod.ts';
import * as path from 'https://deno.land/std@0.178.0/path/mod.ts';

const BASE_PATH = './dist';
const PORT = 2222;

const reqHandler = async (req: Request) => {
	let filePath = BASE_PATH + new URL(req.url).pathname;

	if (path.extname(filePath) === '') {
		filePath += '/index.html';
	}

	let fileSize;
	try {
		fileSize = (await Deno.stat(filePath)).size;
	} catch (e) {
		if (e instanceof Deno.errors.NotFound) {
			filePath = BASE_PATH + '/404.html';
			fileSize = (await Deno.stat(filePath)).size;
			// return new Response(null, { status: 404 });
		} else {
			return new Response(null, { status: 500 });
		}
	}
	const body = (await Deno.open(filePath)).readable;
	return new Response(body, {
		headers: {
			'content-length': fileSize.toString(),
			'content-type': typeByExtension(path.extname(filePath)) ||
				'application/octet-stream',
		},
	});
};

serve(reqHandler, { port: PORT });
