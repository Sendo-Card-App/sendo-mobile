import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { Asset } from 'expo-asset';

const earthRef = useRef();
const onContextCreate = async (gl) => {
  const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  const renderer = new Renderer({ gl });
  renderer.setSize(width, height);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  //  Load earth texture from remote URL
  const textureLoader = new THREE.TextureLoader();
  const texture = await textureLoader.loadAsync(
    'https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-dashboard/assets/img/earth.jpg'
  );

  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshPhongMaterial({ map: texture });
  const earth = new THREE.Mesh(geometry, material);
  scene.add(earth);
  earthRef.current = earth;

  camera.position.z = 2.5;

  const animate = () => {
    requestAnimationFrame(animate);
    earth.rotation.y += 0.005;
    renderer.render(scene, camera);
    gl.endFrameEXP();
  };
  animate();
};

