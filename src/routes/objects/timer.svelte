<script lang="ts">
	import { add_renderer, state } from './game_state';
	import * as THREE from 'three';
	import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

	const time_limit = 61;
	const time_labels: CSS2DObject[] = [];

	let end_time: number;
	let prev_time: number | null = null;
	let timer_bg: THREE.Mesh;
	let timer_width: number;
	let timer_height: number;
	add_renderer('2', {
		setup(props) {
			return new Promise(async (resolve) => {
				const { scene, camera } = props;

				const fov = 45;
				// find height at distance = 1 and fov = 45 degrees
				const height = 2 * Math.tan((fov * Math.PI) / 360) * 1;
				const width = height * (16.0 / 9.0);

				const geometry = new THREE.PlaneGeometry(width / 8, height / 8);
				const material = new THREE.MeshBasicMaterial({ color: 0x222222 });
				timer_bg = new THREE.Mesh(geometry, material);

				for (let i = 0; i <= time_limit; i++) {
					const div = document.createElement('div');
					div.className = 'timerLabel';
					div.textContent = i.toString();
					div.style.color = 'white';
					const label = new CSS2DObject(div);
					label.visible = false;
					timer_bg.add(label);
					time_labels.push(label);
				}

				scene!.add(timer_bg);

				timer_width = width / 2 - width / 16;
				timer_height = height / 2 - height / 16;

				let promise = new Promise((res) => {});

				// let font = await promise;

				resolve();
			});
		},
		render(props, dt) {
			const { camera } = props;

			if (!end_time) {
				end_time = performance.now() + time_limit * 1000;
			}

			let time_remaining = end_time - performance.now();
			timer_bg.position.x = camera!.position.x + timer_width;
			timer_bg.position.y = camera!.position.y + timer_height;
			timer_bg.position.z = camera!.position.z - 1;

			let display_time = Math.floor(time_remaining / 1000);

			if (display_time !== prev_time && display_time >= 0) {
				time_labels[display_time].visible = true;
				if (prev_time !== null) {
					time_labels[prev_time].visible = false;
				}

				prev_time = display_time;
			}

			if (time_remaining <= 0) {
				state.set('3');
			}
		}
	});
</script>
