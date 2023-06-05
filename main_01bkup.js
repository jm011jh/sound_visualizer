// https://codesandbox.io/s/waves-by-value-noise-forked-kywok3?file=/index.html:799-824
// ThreeJS and Third-party deps
import '/style.css'
import * as THREE from "three";
import * as dat from "dat.gui";
import Stats from "three/examples/jsm/libs/stats.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Core boilerplate code deps
import {
  createCamera,
  createRenderer,
  runApp,
  getDefaultUniforms,
  createComposer
} from "./core-utils";

// global.THREE = THREE;

/**************************************************
 * 0. Tweakable parameters for the scene
 *************************************************/
const uniforms_01 = {
  ...getDefaultUniforms(),
  u_pointsize: { value: 1.0 },
  // wave 1
  u_noise_freq_1: { value: 1.0 },
  u_noise_amp_1: { value: 0.3 },
  u_spd_modifier_1: { value: 0.5 },
  // wave 2
  u_noise_freq_2: { value: 1.0 },
  u_noise_amp_2: { value: 0.3 },
  u_spd_modifier_2: { value: 0.3 }
};
const uniforms_02 = {
  ...getDefaultUniforms(),
  u_pointsize: { value: 1.0 },
  // wave 1
  u_noise_freq_1: { value: 1.0 },
  u_noise_amp_1: { value: 0.3 },
  u_spd_modifier_1: { value: 0.5 },
  // wave 2
  u_noise_freq_2: { value: 1.0 },
  u_noise_amp_2: { value: 0.3 },
  u_spd_modifier_2: { value: 0.3 }
};
/**************************************************
 * 1. Initialize core threejs components
 *************************************************/
// Create the scene
const scene = new THREE.Scene();

// Create the renderer via 'createRenderer',
// 1st param receives additional WebGLRenderer properties
// 2nd param receives a custom callback to further configure the renderer
const renderer = createRenderer({ antialias: true });

// Create the camera
// Pass in fov, near, far and camera position respectively
const camera = createCamera(60, 1, 10,{x: 0.1, y: 0.1, z: 2});

// Create Light
const ambientLight = new THREE.AmbientLight(0xffffff, 10); 
const pointLight = new THREE.PointLight(0xff0000, 10);
pointLight.position.set(2, 2, 2);
scene.add(ambientLight)
scene.add(pointLight);

//Create Composer
const composer = createComposer(renderer,scene, camera)
/**************************************************
 * 2. Build your scene in this threejs app
 * This app object needs to consist of at least the async initScene() function (it is async so the animate function can wait for initScene() to finish before being called)
 * initScene() is called after a basic threejs environment has been set up, you can add objects/lighting to you scene in initScene()
 * if your app needs to animate things(i.e. not static), include a updateScene(interval, elapsed) function in the app as well
 *************************************************/
const app = {
  vertexShader_01() {
    return `
    #define PI 3.14159265359

    uniform float u_time;
    uniform float u_pointsize;
    uniform float u_noise_amp_1;
    uniform float u_noise_freq_1;
    uniform float u_spd_modifier_1;
    uniform float u_noise_amp_2;
    uniform float u_noise_freq_2;
    uniform float u_spd_modifier_2;

    // 2D Random
    float random (in vec2 st) {
        return fract(sin(dot(st.xy,
                            vec2(12.9898,78.233)))
                    * 43758.5453123);
    }

    // 2D Noise based on Morgan McGuire @morgan3d
    // https://www.shadertoy.com/view/4dS3Wd
    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        // Four corners in 2D of a tile
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        // Smooth Interpolation

        // Cubic Hermine Curve.  Same as SmoothStep()
        vec2 u = f*f*(3.0-2.0*f);
        // u = smoothstep(0.,1.,f);

        // Mix 4 coorners percentages
        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }

    mat2 rotate2d(float angle){
        return mat2(cos(angle),-sin(angle),
                  sin(angle),cos(angle));
    }

    void main() {
      gl_PointSize = u_pointsize;

      vec3 pos = position;
      // pos.xy is the original 2D dimension of the plane coordinates
      pos.z += noise(pos.xy * u_noise_freq_1 + u_time * u_spd_modifier_1) * u_noise_amp_1;
      // add noise layering
      // minus u_time makes the second layer of wave goes the other direction
      pos.z += noise(rotate2d(PI / 4.) * pos.yx * u_noise_freq_2 - u_time * u_spd_modifier_2 * 0.6) * u_noise_amp_2;

      vec4 mvm = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvm;
    }
    `;
  },
  vertexShader_02() {
    return `
    #define PI 3.14159265359

    uniform float u_time;
    uniform float u_pointsize;
    uniform float u_noise_amp_1;
    uniform float u_noise_freq_1;
    uniform float u_spd_modifier_1;
    uniform float u_noise_amp_2;
    uniform float u_noise_freq_2;
    uniform float u_spd_modifier_2;

    // 2D Random
    float random (in vec2 st) {
        return fract(sin(dot(st.xy,
                            vec2(12.9898,78.233)))
                    * 43758.5453123);
    }

    // 2D Noise based on Morgan McGuire @morgan3d
    // https://www.shadertoy.com/view/4dS3Wd
    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        // Four corners in 2D of a tile
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        // Smooth Interpolation

        // Cubic Hermine Curve.  Same as SmoothStep()
        vec2 u = f*f*(3.0-2.0*f);
        // u = smoothstep(0.,1.,f);

        // Mix 4 coorners percentages
        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }

    mat2 rotate2d(float angle){
        return mat2(cos(angle),-sin(angle),
                  sin(angle),cos(angle));
    }

    void main() {
      gl_PointSize = u_pointsize;

      vec3 pos = position;
      // pos.xy is the original 2D dimension of the plane coordinates
      pos.z += noise(pos.xy * u_noise_freq_1 + u_time * u_spd_modifier_1) * u_noise_amp_1;
      // add noise layering
      // minus u_time makes the second layer of wave goes the other direction
      pos.z += noise(rotate2d(PI / 4.) * pos.yx * u_noise_freq_2 - u_time * u_spd_modifier_2 * 0.6) * u_noise_amp_2;

      vec4 mvm = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvm;
    }
    `;
  },
  fragmentShader_purple_01() { // purple
    return `
    #ifdef GL_ES
    precision mediump float;
    #endif

    #define PI 3.14159265359
    #define TWO_PI 6.28318530718
    
    uniform vec2 u_resolution;

    void main() {
      vec2 st = gl_FragCoord.xy/u_resolution.xy;

      float alphaPosition = 0.08;
      float alpha = 0.0;
      if(st.x < 0.5) alpha = st.x * alphaPosition;
      if(st.x >= 0.5) alpha = alphaPosition - (st.x * alphaPosition);
      alpha = alpha + 0.05;

      gl_FragColor = vec4( vec3(0.2, 0.05, 0.9), alpha);

      // gl_FragColor = vec4(fract((gl_FragCoord.xy) / u_resolution), 1, 1);
      // gl_FragColor = vec4(vec3(0.3, st), 1.0);
    }
    `;
  },
  fragmentShader_white_01() { // white
    return `
    #ifdef GL_ES
    precision mediump float;
    #endif

    #define PI 3.14159265359
    #define TWO_PI 6.28318530718
    
    uniform vec2 u_resolution;

    void main() {
      vec2 st = gl_FragCoord.xy/u_resolution.xy;

      float alphaPosition = 0.04;
      float alpha = 0.0;
      if(st.x < 0.5) alpha = st.x * alphaPosition - 0.01;
      if(st.x >= 0.5) alpha = alphaPosition - (st.x * alphaPosition) - 0.01;
      if(alpha < 0.0) alpha = 0.0;
      gl_FragColor = vec4( vec3(1, 1, 1), alpha);

    }
    `;
  },
  fragmentShader_purple_02() { // purple
    return `
    #ifdef GL_ES
    precision mediump float;
    #endif

    #define PI 3.14159265359
    #define TWO_PI 6.28318530718
    
    uniform vec2 u_resolution;

    void main() {
      vec2 st = gl_FragCoord.xy/u_resolution.xy;

      float alphaPosition = 0.015;
      float alpha = 0.0;
      if(st.x < 0.5) alpha = st.x * alphaPosition;
      if(st.x >= 0.5) alpha = alphaPosition - (st.x * alphaPosition);
      // alpha = alpha + 0.05;

      gl_FragColor = vec4( vec3(0.2, 0.05, 0.9), alpha);
    }
    `;
  },
  fragmentShader_white_02() { // white
    return `
    #ifdef GL_ES
    precision mediump float;
    #endif

    #define PI 3.14159265359
    #define TWO_PI 6.28318530718
    
    uniform vec2 u_resolution;

    void main() {
      vec2 st = gl_FragCoord.xy/u_resolution.xy;

      float alphaPosition = 0.02;
      float alpha = 0.0;
      if(st.x < 0.5) alpha = st.x * alphaPosition - 0.007;
      if(st.x >= 0.5) alpha = alphaPosition - (st.x * alphaPosition) - 0.007;
      if(alpha < 0.0) alpha = 0.0;
      gl_FragColor = vec4( vec3(1, 1, 1), alpha);

    }
    `;
  },
  async initScene() {
    // OrbitControls
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;

    // Environment
    scene.background = new THREE.Color("#0d1214");
    scene.fog = new THREE.Fog(0x0d1214, 1, 4)
    // Mesh
    const visualizerObj_01 = new THREE.Object3D()
    const planeGeometry_01 = new THREE.PlaneGeometry(3, 10, 50, 2000);
    const material_purple_01 = new THREE.ShaderMaterial({
      uniforms: uniforms_01,
      vertexShader: this.vertexShader_01(),
      fragmentShader: this.fragmentShader_purple_01(),
      transparent: true,
    });
    const material_white_01 = new THREE.ShaderMaterial({
      uniforms: uniforms_01,
      vertexShader: this.vertexShader_01(),
      fragmentShader: this.fragmentShader_white_01(),
      transparent: true,
    });
    const effPurple_01 = new THREE.Points(planeGeometry_01, material_purple_01);
    const effWhite_01 = new THREE.Points(planeGeometry_01, material_white_01);

    const visualizerObj_02 = new THREE.Object3D()
    const planeGeometry_02 = new THREE.PlaneGeometry(2, 6, 150, 2000);
    const material_purple_02 = new THREE.ShaderMaterial({
      uniforms: uniforms_02,
      vertexShader: this.vertexShader_02(),
      fragmentShader: this.fragmentShader_purple_02(),
      transparent: true,
    });
    const material_white_02 = new THREE.ShaderMaterial({
      uniforms: uniforms_02,
      vertexShader: this.vertexShader_02(),
      fragmentShader: this.fragmentShader_white_02(),
      transparent: true,
    });
    const effPurple_02 = new THREE.Points(planeGeometry_02, material_purple_02);
    const effWhite_02 = new THREE.Points(planeGeometry_02, material_white_02);

    
    visualizerObj_01.add(effPurple_01, effWhite_01)
    visualizerObj_02.add(effPurple_02, effWhite_02)
    scene.add(visualizerObj_01);
    scene.add(visualizerObj_02);

    uniforms_01.u_noise_amp_1.value = 0.4
    uniforms_01.u_noise_amp_2.value = 0.4
    uniforms_01.u_spd_modifier_1.value = 0.15
    uniforms_01.u_spd_modifier_2.value = 0.1

    uniforms_02.u_noise_amp_1.value = 0.4
    uniforms_02.u_noise_amp_2.value = 0.4
    uniforms_02.u_spd_modifier_1.value = 0.15
    uniforms_02.u_spd_modifier_2.value = 0.1
    // set appropriate positioning
    visualizerObj_01.position.set(-0.1, 0.5, -1)
    visualizerObj_01.rotation.x = Math.PI / 2
    visualizerObj_01.rotation.z = Math.PI / 1.9
    
    visualizerObj_02.position.set(-0.5, 0.3, 0)
    visualizerObj_02.rotation.x = Math.PI / 2
    visualizerObj_02.rotation.z = Math.PI / 1.9

    const ctrlUp = document.getElementById('ctrlUp')
    const ctrlDown = document.getElementById('ctrlDown')

    var reTime = 3.0
    ctrlUp.addEventListener('click', e => {
      gsap.to(uniforms_01.u_spd_modifier_1,{value : 0.6,duration : reTime,})
      gsap.to(uniforms_01.u_spd_modifier_2,{value : 0.6,duration : reTime,})
      gsap.to(uniforms_02.u_spd_modifier_1,{value : 0.6,duration : reTime,})
      gsap.to(uniforms_02.u_spd_modifier_2,{value : 0.6,duration : reTime,})
      
      gsap.to(uniforms_01.u_noise_freq_1,{value : 1.6,duration : reTime,})
      gsap.to(uniforms_01.u_noise_freq_2,{value : 1.6,duration : reTime,})
      gsap.to(uniforms_02.u_noise_freq_1,{value : 1.6,duration : reTime,})
      gsap.to(uniforms_02.u_noise_freq_2,{value : 1.6,duration : reTime,})
    })
    ctrlDown.addEventListener('click', e => {
      gsap.to(uniforms_01.u_spd_modifier_1,{value : 0.15,duration : reTime,})
      gsap.to(uniforms_01.u_spd_modifier_2,{value : 0.1,duration :  reTime,})
      gsap.to(uniforms_02.u_spd_modifier_1,{value : 0.15,duration : reTime,})
      gsap.to(uniforms_02.u_spd_modifier_2,{value : 0.1,duration :  reTime,})
      
      gsap.to(uniforms_01.u_noise_freq_1,{value : 1.0,duration : reTime,})
      gsap.to(uniforms_01.u_noise_freq_2,{value : 1.0,duration : reTime,})
      gsap.to(uniforms_02.u_noise_freq_1,{value : 1.0,duration : reTime,})
      gsap.to(uniforms_02.u_noise_freq_2,{value : 1.0,duration : reTime,})
    })
    // GUI controls
    // const gui = new dat.GUI();

    // gui
    //   .add(uniforms.u_pointsize, "value", 1.0, 10.0, 0.5)
    //   .name("Point Size")
    //   .onChange((val) => {
    //     uniforms.u_pointsize.value = val;
    //   });

    // let wave1 = gui.addFolder("Wave 1");
    // wave1
    //   .add(uniforms.u_noise_freq_1, "value", 0.1, 3, 0.1)
    //   .name("Frequency")
    //   .onChange((val) => {
    //     uniforms.u_noise_freq_1.value = val;
    //   });
    // wave1
    //   .add(uniforms.u_noise_amp_1, "value", 0.1, 3, 0.1)
    //   .name("Amplitude")
    //   .onChange((val) => {
    //     uniforms.u_noise_amp_1.value = val;
    //   });
    // wave1
    //   .add(uniforms.u_spd_modifier_1, "value", 0.01, 2.0, 0.01)
    //   .name("Speed")
    //   .onChange((val) => {
    //     uniforms.u_spd_modifier_1.value = val;
    //   });

    // let wave2 = gui.addFolder("Wave 2");
    // wave2
    //   .add(uniforms.u_noise_freq_2, "value", 0.1, 3, 0.1)
    //   .name("Frequency")
    //   .onChange((val) => {
    //     uniforms.u_noise_freq_2.value = val;
    //   });
    // wave2
    //   .add(uniforms.u_noise_amp_2, "value", 0.1, 3, 0.1)
    //   .name("Amplitude")
    //   .onChange((val) => {
    //     uniforms.u_noise_amp_2.value = val;
    //   });
    // wave2
    //   .add(uniforms.u_spd_modifier_2, "value", 0.01, 2.0, 0.01)
    //   .name("Speed")
    //   .onChange((val) => {
    //     uniforms.u_spd_modifier_2.value = val;
    //   });

    // Stats - show fps
    this.container = document.getElementById('webGl-container')
    this.stats1 = new Stats();
    this.stats1.showPanel(0); // Panel 0 = fps
    this.stats1.domElement.style.cssText =
      "position:absolute;top:0px;left:0px;";
    // this.container is the parent DOM element of the threejs canvas element
    this.container.appendChild(this.stats1.domElement);
  },
  // @param {number} interval - time elapsed between 2 frames
  // @param {number} elapsed - total time elapsed since app start
  updateScene(interval, elapsed) {
    this.controls.update();
    this.stats1.update();
  }
};

/**************************************************
 * 3. Run the app
 * 'runApp' will do most of the boilerplate setup code for you:
 * e.g. HTML container, window resize listener, mouse move/touch listener for shader uniforms, THREE.Clock() for animation
 * Executing this line puts everything together and runs the app
 * ps. if you don't use custom shaders, pass undefined to the 'uniforms'(2nd-last) param
 * ps. if you don't use post-processing, pass undefined to the 'composer'(last) param
 *************************************************/
runApp(app, scene, renderer, camera, true, uniforms_01, uniforms_02, composer);

// navigator.mediaDevices.getUserMedia({
//   audio:{
//     sampleRate: 16000,
//   },
// })
// .then((stream) => {
//   console.log(stream)
// })