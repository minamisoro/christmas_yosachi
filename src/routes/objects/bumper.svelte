<script lang="ts">
	import type { BufferGeometry, CylinderGeometry } from 'three';
	import * as THREE from 'three';
	import { add_renderer, bumpers } from './game_state';

	export let grid_size: number;
	export let width: number;
	export let height: number;
	export let color: string;
	export let bumper_percentage: number;

	enum ShapeType {
		CIRCLE = 0,
		CROSS,
		POLYGON,
		EBIFLY,
		__LENGTH
	}

	add_renderer('2', {
		setup(props) {
			return new Promise((resolve) => {
				const { scene } = props;

				let bumper_count = Math.floor((width - 2) * (height - 2) * bumper_percentage);
				let material = new THREE.MeshBasicMaterial({ color: color });

				let generated_shapes: {
					center: [number, number];
					radius: number;
					shape_type: ShapeType;
				}[] = [];
				while (bumper_count > 0) {
					// generate random center point and radius
					let max_r =
						Math.floor(
							Math.random() * (height * grid_size * (1.0 / 20.0)) +
								height * grid_size * (1.0 / 30.0)
						) / 2.0;
					let x =
						Math.floor(
							Math.random() * (width * grid_size - 2 * grid_size - max_r * 2 - 10 * grid_size)
						) +
						max_r +
						5 * grid_size;
					let y =
						Math.floor(
							Math.random() * (height * grid_size - 2 * grid_size - max_r * 2 - 10 * grid_size)
						) +
						max_r +
						5 * grid_size;

					// check if it overlaps with any other shapes
					let overlaps = false;
					for (let shape of generated_shapes) {
						let dist = Math.sqrt(
							Math.pow(x - shape.center[0], 2) + Math.pow(y - shape.center[1], 2)
						);
						if (dist < max_r + shape.radius + (height * grid_size) / 40.0) {
							overlaps = true;
							break;
						}
					}

					if (overlaps) {
						continue;
					}

					let shape_type: ShapeType;
					let shape_index = Math.floor(Math.random() * (ShapeType.__LENGTH - 2));

					switch (shape_index) {
						case 0:
							shape_type = ShapeType.CIRCLE;
							break;
						case 1:
							shape_type = ShapeType.CROSS;
							break;
						case 2:
							shape_type = ShapeType.POLYGON;
							break;
						case 3:
							shape_type = ShapeType.EBIFLY;
							break;
						default:
							shape_type = ShapeType.CIRCLE;
							break;
					}

					generated_shapes.push({
						center: [x, y],
						radius: max_r,
						shape_type: shape_type
					});

					// calculate amount of integer lattice point in the circle with radius <max_r>
					let count = 0;
					for (let i = -max_r; i <= max_r; i++) {
						for (let j = -max_r; j <= max_r; j++) {
							if (i * i + j * j <= max_r * max_r) {
								count++;
							}
						}
					}

					bumper_count -= count / grid_size;
				}

				for (let shape of generated_shapes) {
					let geometry: BufferGeometry;
					let default_xrot: number;
					let default_yrot: number;
					let default_zrot: number;

					switch (shape.shape_type) {
						case ShapeType.CIRCLE: {
							geometry = new THREE.CylinderGeometry(shape.radius, shape.radius, grid_size * 2, 30);

							default_xrot = Math.PI / 2;
							default_yrot = 0;
							default_zrot = 0;
							break;
						}
						case ShapeType.CROSS: {
							let top_x = -shape.radius * Math.cos((Math.PI / 8) * 3);
							let top_y = -shape.radius * Math.sin((Math.PI / 8) * 3);

							let bottom_x = -shape.radius * Math.cos(Math.PI / 8);
							let bottom_y = -shape.radius * Math.sin(Math.PI / 8);

							let center_x = top_x;
							let center_y = bottom_y;

							let cross = new THREE.Shape();

							cross.moveTo(top_x, top_y);
							cross.lineTo(center_x, center_y);
							cross.lineTo(bottom_x, bottom_y);
							cross.lineTo(bottom_x, -bottom_y);
							cross.lineTo(center_x, -center_y);
							cross.lineTo(top_x, -top_y);
							cross.lineTo(-top_x, -top_y);
							cross.lineTo(-center_x, -center_y);
							cross.lineTo(-bottom_x, -bottom_y);
							cross.lineTo(-bottom_x, bottom_y);
							cross.lineTo(-center_x, center_y);
							cross.lineTo(-top_x, top_y);
							cross.lineTo(top_x, top_y);

							geometry = new THREE.ExtrudeGeometry(cross, {
								depth: grid_size * 2,
								bevelEnabled: false
							});

							default_xrot = 0;
							default_yrot = 0;
							default_zrot = (Math.random() * Math.PI) / 2;

							break;
						}
						case ShapeType.POLYGON: {
							break;
						}
						case ShapeType.EBIFLY: {
							break;
						}
						default: {
							geometry = new THREE.CylinderGeometry(shape.radius, 32);
							break;
						}
					}

					let mesh = new THREE.Mesh(geometry!, material);

					mesh.rotateX(default_xrot!);
					mesh.rotateY(default_yrot!);
					mesh.rotateZ(default_zrot!);

					mesh.position.x = shape.center[0] - (width * grid_size) / 2;
					mesh.position.y = shape.center[1] - (height * grid_size) / 2;

					scene!.add(mesh);

					$bumpers.push(mesh);
				}

				// bumpers at edges
				let box_size = grid_size * 5;

				let box_widthy = new THREE.BoxGeometry(width * grid_size, box_size, box_size);
				let box_heighty = new THREE.BoxGeometry(box_size, height * grid_size, box_size);
				let box_top = new THREE.Mesh(box_widthy, material);
				let box_bottom = new THREE.Mesh(box_widthy, material);
				let box_left = new THREE.Mesh(box_heighty, material);
				let box_right = new THREE.Mesh(box_heighty, material);

				box_top.position.x = 0.0;
				box_top.position.y = (-height / 2.0) * grid_size + box_size / 2.0;
				box_top.position.z = box_size / 2.0;

				box_bottom.position.x = 0.0;
				box_bottom.position.y = (height / 2.0) * grid_size - box_size / 2.0;
				box_bottom.position.z = box_size / 2.0;

				box_left.position.x = (-width / 2.0) * grid_size + box_size / 2.0;
				box_left.position.y = 0.0;
				box_left.position.z = box_size / 2.0;

				box_right.position.x = (width / 2.0) * grid_size - box_size / 2.0;
				box_right.position.y = 0.0;
				box_right.position.z = box_size / 2.0;

				scene!.add(box_top);
				scene!.add(box_bottom);
				scene!.add(box_left);
				scene!.add(box_right);

				$bumpers.push(box_top);
				$bumpers.push(box_bottom);
				$bumpers.push(box_left);
				$bumpers.push(box_right);

				resolve();
			});
		},
		render(props, dt) {}
	});
</script>
