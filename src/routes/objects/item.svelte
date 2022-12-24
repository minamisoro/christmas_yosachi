<script lang="ts">
	import { add_renderer, items as itemsStore } from './game_state';
	import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import * as THREE from 'three';

	export let grid_size: number;
	export let width: number;
	export let height: number;

	const strawberry_scale = new THREE.Vector3(25, 25, 25);
	const ebifly_scale = new THREE.Vector3(0.08, 0.04, 0.08);

	let ebifly: THREE.Group;
	let strawberry: THREE.Group;
	let revive: (number | undefined)[] = [];
	add_renderer('2', {
		setup(props) {
			return new Promise(async (resolve) => {
				const { scene } = props;

				const loader = new GLTFLoader();
				let gltf1 = load_model('shapes/strawberry.glb', loader);
				let gltf2 = load_model('shapes/ebifly.glb', loader);

				let strawberry_material = new THREE.MeshBasicMaterial({ color: 0xe81720 });
				let ebifly_material = new THREE.MeshBasicMaterial({ color: 0xeeb311 });

				let gltfs = await Promise.all([gltf1, gltf2]);

				strawberry = gltfs[0].scene;
				let children = strawberry.children as THREE.Mesh[];
				for (let child of children) {
					child.material = strawberry_material;
				}
				ebifly = gltfs[1].scene;
				children = ebifly.children as THREE.Mesh[];
				for (let child of children) {
					child.material = ebifly_material;
				}

				for (let x = 7.5; x < width - 5; x += 5) {
					for (let y = 7.5; y < height - 5; y += 5) {
						let item;
						let type;

						if (Math.random() < 0.05) {
							item = ebifly.clone();
							item.scale.set(
								ebifly_scale.x * grid_size,
								ebifly_scale.y * grid_size,
								ebifly_scale.z * grid_size
							);
							type = 0;
						} else {
							item = strawberry.clone();
							item.scale.set(
								strawberry_scale.x * grid_size,
								strawberry_scale.y * grid_size,
								strawberry_scale.z * grid_size
							);
							type = 1;
						}

						item.rotateX(Math.random() * Math.PI * 2);
						item.rotateY(Math.random() * Math.PI * 2);
						item.rotateZ(Math.random() * Math.PI * 2);
						item.position.set(
							x * grid_size + grid_size / 2.0 - (width / 2.0) * grid_size,
							y * grid_size + grid_size / 2.0 - (height / 2.0) * grid_size,
							0
						);
						scene!.add(item);
						$itemsStore.push({ model: item, type: type });
					}
				}

				resolve();
			});
		},
		render(props, dt) {
			const { items } = props;

			const now = performance.now();

			for (let [i, item] of items!.entries()) {
				item.model.rotateX(dt * 0.001);
				item.model.rotateY(dt * 0.001);

				if (!item.model.visible && !revive[i]) {
					revive[i] = now + 5000 + Math.random() * 5000;
				}

				if (revive[i] && now > revive[i]!) {
					item.model.visible = true;
					revive[i] = undefined;
				}
			}
		}
	});

	function load_model(dir: string, loader: GLTFLoader) {
		return new Promise<GLTF>((resolve) => {
			loader.load(dir, (g) => {
				resolve(g);
			});
		});
	}
</script>
