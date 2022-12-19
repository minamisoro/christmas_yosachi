<script lang="ts">
	import { add_renderer } from './game_state';
	import * as THREE from 'three';

	export let color: string;
	export let grid_size: number;
	export let width: number;
	export let height: number;

	let floor: THREE.Mesh;

	add_renderer('2', {
		setup(props) {
			return new Promise((resolve) => {
				const { scene } = props;

				const geometry = new THREE.PlaneGeometry(width * grid_size, height * grid_size);
				const material = new THREE.MeshBasicMaterial({ color: color });
				const p = new THREE.Mesh(geometry, material);
				p.position.set(0, 0, 0);

				floor = p;

				scene!.add(floor);

				resolve();
			});
		},
		render(props, dt) {}
	});
</script>
