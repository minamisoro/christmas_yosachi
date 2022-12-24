<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import * as THREE from 'three';
	import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
	import {
		width,
		height,
		time,
		props,
		canvas as canvasStore,
		scene as sceneStore,
		camera as cameraStore,
		key,
		orig_camera_pos_z,
		state
	} from './game_state.js';
	import type { Renderer } from './renderer.js';

	let listeners: { [state: string]: null | Renderer[] } = {};
	let frame: number;
	let renderer: THREE.WebGLRenderer;
	let label_renderer: CSS2DRenderer;
	let canvas: HTMLCanvasElement;
	let container: HTMLElement;

	let scenes: { [scene: string]: THREE.Scene } = {};
	let camera: THREE.PerspectiveCamera;

	const fov = 45;

	onMount(() => {
		renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
		renderer.setSize($width, $height);
		container.appendChild(renderer.domElement);

		label_renderer = new CSS2DRenderer();
		label_renderer.setSize($width, $height);
		label_renderer.domElement.style.position = 'absolute';
		label_renderer.domElement.style.top = '0';
		container.appendChild(label_renderer.domElement);

		handleResize();

		canvas = renderer.domElement;

		canvasStore.set(canvas);

		let keys = Object.keys(listeners).sort();

		// setup entities
		for (let key of keys) {
			let lis = listeners[key];
			let scene = new THREE.Scene();
			scenes[key] = scene;
			sceneStore.set(scene);

			lis!.forEach(async (entity) => {
				if (entity.setup) {
					let p = entity.setup($props);
					if (p) await p;
				}
				entity.ready = true;
			});
		}

		return createLoop((elapsed, dt) => {
			time.set(elapsed);
			render(dt);
		});
	});

	setContext(key, {
		add(state: string, fn: Renderer) {
			if (!listeners[state]) listeners[state] = [];

			this.remove(state, fn);
			listeners[state]!.push(fn);
		},
		remove(state: string, fn: Renderer) {
			const idx = listeners[state]!.indexOf(fn);
			if (idx !== -1) listeners[state]!.splice(idx, 1);
		}
	});

	function createLoop(fn: (elapsed: number, dt: number) => void) {
		let elapsed = 0;
		let last = performance.now();

		function loop() {
			let now = performance.now();
			let dt = now - last;
			elapsed += dt;
			last = now;
			fn(elapsed, dt);
			frame = requestAnimationFrame(loop);
		}

		frame = requestAnimationFrame(loop);

		return () => {
			cancelAnimationFrame(frame);
		};
	}

	function render(dt: number) {
		let scene = scenes[$state];

		sceneStore.set(scene);
		cameraStore.set(camera);

		listeners[$state]!.forEach((entity) => {
			try {
				if (entity.mounted && entity.ready && entity.render) {
					entity.render($props, dt);
				}
			} catch (err) {
				console.error(err);
				cancelAnimationFrame(frame);
				console.warn('Animation loop stopped due to an error');
			}
		});

		renderer.render(scene, camera);
		label_renderer.render(scene, camera);
	}

	function handleResize() {
		let w = window.innerWidth * 1.0;
		let h = window.innerHeight * 1.0;
		let curr_ratio = w / h;

		let ratio = 16.0 / 9.0;

		if (curr_ratio > ratio) {
			w = h * ratio;
		} else {
			h = w / ratio;
		}

		width.set(w);
		height.set(h);

		let distance = $height / (2 * Math.tan((fov * Math.PI) / 360));

		camera = new THREE.PerspectiveCamera(fov, $width / $height, 0.1, distance + 10000);
		camera.position.z = distance - 1;
		orig_camera_pos_z.set(camera.position.z);

		renderer.setSize(w, h);
		label_renderer.setSize(w, h);
	}
</script>

<div bind:this={container} />
<svelte:window on:resize={handleResize} />
<slot />

<style>
	div {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
