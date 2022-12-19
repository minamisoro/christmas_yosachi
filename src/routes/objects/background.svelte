<script lang="ts">
	import { add_renderer } from './game_state.js';
	import * as THREE from 'three';

	export let color: string;

	let bg: THREE.Mesh;
	let curr_width: number;
	let curr_height: number;

	add_renderer('3', {
		setup(props) {
			return new Promise((resolve) => {
				const { width, height, scene } = props;

				const geometry = new THREE.PlaneGeometry(width, height);
				const material = new THREE.MeshBasicMaterial({ color });
				const p = new THREE.Mesh(geometry, material);
				p.position.set(0, 0, -5);
				curr_width = width!;
				curr_height = height!;

				bg = p;

				scene!.add(bg);

				resolve();
			});
		},
		render(props, dt) {
			const { width, height, camera } = props;
			if (width !== curr_width || height !== curr_height) {
				bg.geometry = new THREE.PlaneGeometry(width!, height!);
				curr_width = width!;
				curr_height = height!;
			}

			bg.position.x = camera!.position.x;
			bg.position.y = camera!.position.y;
			bg.position.z = -5;
		}
	});
</script>
