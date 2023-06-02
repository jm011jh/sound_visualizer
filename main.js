// https://codesandbox.io/s/waves-by-value-noise-forked-kywok3?file=/index.html:799-824
// ThreeJS and Third-party deps
// import '/style.css'
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

let scene, camera, renderer, ribbon, composer

const container = document.querySelector('#container')

const init = () => {

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 10000 )
  camera.position.z = 2

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild( renderer.domElement )


  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
  bloomPass.threshold = 0;
  bloomPass.strength = 0.35;
  bloomPass.radius = 0;
  
  const outputPass = new OutputPass( THREE.ReinhardToneMapping );
  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);
  composer.addPass(outputPass);


  const orbit = new OrbitControls(camera, renderer.domElement);




  ribbon = new THREE.Mesh(
    new THREE.PlaneGeometry( 2, 2, 1280, 1280 ),
    new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 1.0 },
      },
      vertexShader: `
        varying vec3 vEC;
        uniform float time;

        float iqhash(float n) {
          return fract(sin(n) * 43758.5453);
        }

        float noise(vec3 x) {
          vec3 p = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          float n = p.x + p.y * 57.0 + 113.0 * p.z;
          return mix(mix(mix(iqhash(n), iqhash(n + 1.0), f.x),
                     mix(iqhash(n + 57.0), iqhash(n + 58.0), f.x), f.y),
                     mix(mix(iqhash(n + 113.0), iqhash(n + 114.0), f.x),
                     mix(iqhash(n + 170.0), iqhash(n + 171.0), f.x), f.y), f.z);
        }

        float xmb_noise2(vec3 x) {
          return cos(x.z * 4.0) * cos(x.z + time / 10.0 + x.x);
        }

        void main() {
          vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vec3 v = vec3(pos.x, 0.0, pos.y);
          vec3 v2 = v;
          vec3 v3 = v;

          v.y = xmb_noise2(v2) / 10.0;

          v3.x -= time / 5.0;
          v3.x /= 4.0;

          v3.z -= time / 5.0;
          v3.y -= time / 100.0;

          v.z -= noise(v3 * 7.0) / 15.0;
          v.y -= noise(v3 * 7.0) / 15.0 + cos(v.x * 2.0 - time / 2.0) / 5.0 - 0.3;

          vEC = v;
          gl_Position = vec4(v, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vEC;

        void main()
        {
           const vec3 up = vec3(0.0, 0.0, 1.0);
           vec3 x = dFdx(vEC);
           vec3 y = dFdy(vEC);
           vec3 normal = normalize(cross(x, y));
           float c = 1.0 - dot(normal, up);
           c = (1.0 - cos(c * c)) / 1.0;
           gl_FragColor = vec4(0.447, 0, 0.8, c * 1.5);
        }
      `,
      extensions: {
        derivatives: true,
        fragDepth: false,
        drawBuffers: false,
        shaderTextureLOD: false
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: false,
    })
  )

  scene.add( ribbon )

  resize()
  window.addEventListener( 'resize', resize )

}


const resize = () => {

  const { offsetWidth, offsetHeight } = container

  renderer.setSize( offsetWidth, offsetHeight )
  renderer.setPixelRatio( devicePixelRatio )

  camera.aspect = offsetWidth / offsetHeight
  camera.updateProjectionMatrix()

  ribbon.scale.set( camera.aspect * 1.55, 0.75, 1 )

}

const animate = () => {

  ribbon.material.uniforms.time.value += 0.01

  renderer.render( scene, camera )
  composer.render();
  requestAnimationFrame( () => animate() )

}

init()
animate()


// Toggler, quick and easy
