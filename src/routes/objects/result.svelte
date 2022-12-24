<script lang="ts">
	import { add_renderer, prev_canvas } from './game_state.js';
	import * as THREE from 'three';
	import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
	import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import type { TextureLoader } from 'three';

	export let color: string;
	const base_grid_size = 50;
	const strawberry_scale = new THREE.Vector3(25, 25, 25);
	const ebifly_scale = new THREE.Vector3(0.08, 0.04, 0.08);

	let bg: THREE.Mesh;
	let score_board: THREE.Mesh;
	let ebifly: THREE.Group;
	let strawberry: THREE.Group;
	let cakes: THREE.Group;

	let curr_width: number;
	let curr_height: number;
	let strawberry_count: number;
	let ebifly_count: number;

	let state = 0;
	let local_dt = 0;

	add_renderer('3', {
		setup(props) {
			return new Promise(async (resolve) => {
				const { width, height, scene } = props;

				const bg_geo = new THREE.PlaneGeometry(width, height);
				const bg_mat = new THREE.MeshBasicMaterial({ color });
				const b = new THREE.Mesh(bg_geo, bg_mat);
				b.position.set(0, 0, -5);
				curr_width = width!;
				curr_height = height!;

				const score_geo = new THREE.PlaneGeometry(width! * 0.6, height! * 0.8);
				const score_mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.0 });
				const s = new THREE.Mesh(score_geo, score_mat);
				s.position.set(0, -height! * 0.8, -4);

				const score_div = document.createElement('div');
				score_div.className = 'score-title';
				score_div.textContent = 'Score';
				score_div.style.color = 'white';
				score_div.style.fontSize = '80px';
				const score_css = new CSS2DObject(score_div);
				score_css.position.set(0, height! * 0.3, 0);
				s.add(score_css);

				const loader = new GLTFLoader();
				const image_loader = new THREE.TextureLoader();
				let gltf1 = load_model('shapes/strawberry.glb', loader);
				let gltf2 = load_model('shapes/ebifly.glb', loader);
				let texture1 = load_model('illust/christmas.png', image_loader);
				let texture2 = load_model('illust/ebifly.png', image_loader);

				let strawberry_material = new THREE.MeshBasicMaterial({ color: 0xe81720 });
				let ebifly_material = new THREE.MeshBasicMaterial({ color: 0xeeb311 });

				let gltfs = await Promise.all([gltf1, gltf2, texture1, texture2]);

				strawberry = (gltfs[0] as GLTF).scene;
				let children = strawberry.children as THREE.Mesh[];
				for (let child of children) {
					child.material = strawberry_material;
				}
				ebifly = (gltfs[1] as GLTF).scene;
				children = ebifly.children as THREE.Mesh[];
				for (let child of children) {
					child.material = ebifly_material;
				}

				strawberry.scale.set(
					strawberry_scale.x * base_grid_size,
					strawberry_scale.y * base_grid_size,
					strawberry_scale.z * base_grid_size
				);
				ebifly.scale.set(
					ebifly_scale.x * base_grid_size,
					ebifly_scale.y * base_grid_size,
					ebifly_scale.z * base_grid_size
				);

				strawberry.position.set(-width! * 0.15 * 1.5, height! * 0.125, 0);
				ebifly.position.set(width! * 0.15 * (1.0 / 1.5), height! * 0.1, 0);

				s.add(strawberry);
				s.add(ebifly);

				// add yosachi and ebifly
				const yosachi_mat = new THREE.SpriteMaterial({ map: gltfs[2] as THREE.Texture });
				const yosachi_image = new THREE.Sprite(yosachi_mat);

				const ebifly_mat = new THREE.SpriteMaterial({ map: gltfs[3] as THREE.Texture });
				const ebifly_image = new THREE.Sprite(ebifly_mat);

				yosachi_image.scale.set(
					500 * (width! / 1404.0),
					500 * (width! / 1404.0),
					500 * (width! / 1404.0)
				);
				yosachi_image.position.set(
					-width! / 3.0,
					-height! / 2.0 + 500 * 0.4 * (width! / 1404.0),
					0
				);

				ebifly_image.scale.set(
					150 * (width! / 1404.0),
					150 * (width! / 1404.0),
					150 * (width! / 1404.0)
				);
				ebifly_image.position.set(width! * 0.25, height! * 0.1, width! * 0.15);

				s.add(yosachi_image);
				s.add(ebifly_image);

				bg = b;
				score_board = s;

				scene!.add(bg);
				scene!.add(score_board);

				// create light
				const light = new THREE.DirectionalLight(0xffffff, 1);
				light.position.set(-width! * 0.5, height! * 0.5, 5);
				light.shadow.mapSize.width = 1024;
				light.shadow.mapSize.height = 1024;
				light.shadow.camera.near = 0.5;
				light.shadow.camera.far = 10000;
				scene!.add(light);

				resolve();
			});
		},
		render(props, dt) {
			const { width, height, camera, collected, scene } = props;

			switch (state) {
				case 0: {
					// initialize, keep static image of current canvas
					let w = window.innerWidth * 1.0;
					let h = window.innerHeight * 1.0;
					let curr_ratio = w / h;

					let ratio = 16.0 / 9.0;

					if (curr_ratio > ratio) {
						w = h * ratio;
					} else {
						h = w / ratio;
					}

					let distance = height! / (2 * Math.tan((45 * Math.PI) / 360));
					camera!.position.x = 0;
					camera!.position.y = 0;
					camera!.position.z = distance - 5;

					let material = new THREE.MeshBasicMaterial({ map: $prev_canvas });

					bg.material = material;

					strawberry_count = collected!.filter((x) => x == 1).length;
					ebifly_count = collected!.filter((x) => x == 0).length;

					let strawberry_score = document.createElement('div');
					strawberry_score.className = 'score-total';
					strawberry_score.textContent = '×' + strawberry_count.toString();
					strawberry_score.style.color = 'white';
					strawberry_score.style.fontSize = '40px';
					const strawberry_score_css = new CSS2DObject(strawberry_score);
					strawberry_score_css.position.set(-width! * 0.15, height! * 0.1, 0);
					score_board.add(strawberry_score_css);

					let ebifly_score = document.createElement('div');
					ebifly_score.className = 'score-total';
					ebifly_score.textContent = '×' + ebifly_count.toString();
					ebifly_score.style.color = 'white';
					ebifly_score.style.fontSize = '40px';
					const ebifly_score_css = new CSS2DObject(ebifly_score);
					ebifly_score_css.position.set(width! * 0.15, height! * 0.1, 0);
					score_board.add(ebifly_score_css);

					let score = Math.sqrt(strawberry_count) * 50000 - 1000 * ebifly_count * ebifly_count;

					let score_text = document.createElement('div');
					score_text.className = 'score-total';
					if (score >= 0) {
						score_text.textContent = score.toFixed(0);
					} else {
						score_text.textContent = 'EBIFLY';
					}

					score_text.style.color = 'white';
					score_text.style.fontSize = '60px';
					const score_text_css = new CSS2DObject(score_text);
					score_text_css.position.set(0, -height! * 0.2, 0);
					score_board.add(score_text_css);

					local_dt = 0;
					state = 1;
					break;
				}
				case 1: {
					// fade in from below
					local_dt += dt;

					let t = local_dt / 300.0;
					// transform t so that it eases in at exponential rate
					let new_t = Math.pow(t, 2) * 0.8 + 0.2;

					if (t > 1.0) {
						t = 1.0;
						new_t = 1.0;
						local_dt = 0;
						state = 2;
					}

					let opacity = new_t * 0.4 + 0.2;
					let y = -height! * 0.8 * (1.0 - new_t);
					(score_board.material as THREE.MeshBasicMaterial).opacity = opacity;
					score_board.position.y = y;
					break;
				}
				case 2: {
					// create a cake
					cakes = new THREE.Group();

					let min_radius = width! * 0.05;
					let min_height = height! * 0.25;
					let material = new THREE.MeshStandardMaterial({ color: 0xeef6f7, emissive: 0xffdddd });
					let cake1 = new THREE.Mesh(
						new THREE.CylinderGeometry(min_radius, min_radius, min_height * 3, 32),
						material
					);

					let cake2 = new THREE.Mesh(
						new THREE.CylinderGeometry(min_radius * 2, min_radius * 2, min_height * 2, 32),
						material
					);

					let cake3 = new THREE.Mesh(
						new THREE.CylinderGeometry(min_radius * 3, min_radius * 3, min_height, 32),
						material
					);

					cake1.castShadow = true;
					cake1.receiveShadow = true;
					cake2.castShadow = true;
					cake2.receiveShadow = true;
					cake3.castShadow = true;
					cake3.receiveShadow = true;

					cakes.add(cake1);
					cakes.add(cake2);
					cakes.add(cake3);

					// attach strawberries earned on the cake
					let scale_size = base_grid_size * 0.5;
					let cake_s = strawberry.clone();
					cake_s.castShadow = true;
					cake_s.receiveShadow = true;
					cake_s.scale.set(
						strawberry_scale.x * scale_size,
						strawberry_scale.y * scale_size,
						strawberry_scale.z * scale_size
					);

					for (let i = 0; i < strawberry_count; i++) {
						let str = cake_s.clone();

						let radius = Math.random() * min_radius * 3;
						let angle = Math.PI * 2 * Math.random();
						let y;

						if (radius < min_radius) {
							y = min_height * 1.5;
						} else if (radius < min_radius * 2.0) {
							y = min_height;
						} else {
							y = min_height * 0.5;
						}

						let x = Math.cos(angle) * radius;
						let z = Math.sin(angle) * radius;

						str.rotateX(Math.PI * 2 * Math.random());
						str.rotateY(Math.PI * 2 * Math.random());
						str.rotateZ(Math.PI * 2 * Math.random());

						str.position.set(x, y, z);

						cakes.add(str);
					}

					// do the same thing with ebifly
					let cake_e = ebifly.clone();
					cake_e.castShadow = true;
					cake_e.receiveShadow = true;
					cake_e.scale.set(
						ebifly_scale.x * scale_size,
						ebifly_scale.y * scale_size,
						ebifly_scale.z * scale_size
					);

					for (let i = 0; i < ebifly_count; i++) {
						let ebi = cake_e.clone();

						let radius = Math.random() * min_radius * 3;
						let angle = Math.PI * 2 * Math.random();
						let y;

						if (radius < min_radius) {
							y = min_height * 1.5;
						} else if (radius < min_radius * 2.0) {
							y = min_height;
						} else {
							y = min_height * 0.5;
						}

						let x = Math.cos(angle) * radius;
						let z = Math.sin(angle) * radius;

						ebi.rotateX(Math.PI * 2 * Math.random());
						ebi.rotateY(Math.PI * 2 * Math.random());
						ebi.rotateZ(Math.PI * 2 * Math.random());
						ebi.position.set(x, y, z);

						cakes.add(ebi);
					}

					cakes.position.set(width! * 0.25, -height! * 0.35, min_radius * 3);

					scene!.add(cakes);

					state = 3;
					break;
				}
				case 3: {
					local_dt += dt;

					let t = local_dt / 300.0;
					// transform t so that it eases in at exponential rate
					let new_t = Math.pow(t, 2) * 0.8 + 0.2;

					if (t > 1.0) {
						t = 1.0;
						local_dt = 0;
						state = 4;
					}
					break;
				}
			}

			if (width !== curr_width || height !== curr_height) {
				bg.geometry = new THREE.PlaneGeometry(width!, height!);
				score_board.geometry = new THREE.PlaneGeometry(width! * 0.8, height! * 0.8);
				curr_width = width!;
				curr_height = height!;
			}

			strawberry.rotateX(dt * 0.001);
			strawberry.rotateY(dt * 0.001);

			ebifly.rotateX(dt * 0.001);
			ebifly.rotateY(dt * 0.001);
		}
	});

	function load_model(dir: string, loader: GLTFLoader | TextureLoader) {
		return new Promise<GLTF | THREE.Texture>((resolve) => {
			loader.load(dir, (g) => {
				resolve(g);
			});
		});
	}
</script>
