import * as THREE from "three";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";

/**
 * Initializes a reasonable uniforms object ready to be used in fragments
 * @returns a uniforms object with u_time, u_mouse and u_resolution
 */
export const getDefaultUniforms = () => {
  return {
    u_time: { value: 0.0 },
    u_mouse: {
      value: {
        x: 0.0,
        y: 0.0
      }
    },
    u_resolution: {
      value: {
        x: window.innerWidth * window.devicePixelRatio,
        y: window.innerHeight * window.devicePixelRatio
      }
    }
  };
};

/**
 * This function contains the boilerplate code to set up the environment for a threejs app;
 * e.g. HTML canvas, resize listener, mouse events listener, requestAnimationFrame
 * Consumer needs to provide the created renderer, camera and (optional) composer to this setup function
 * This has the benefit of bringing the app configurations directly to the consumer, instead of hiding/passing them down one more layer
 * @param {object} app a custom Threejs app instance that needs to call initScene and (optioal) updateScene if animation is needed
 * @param {object} scene Threejs scene instance
 * @param {object} renderer Threejs renderer instance
 * @param {object} camera Threejs camera instance
 * @param {bool} enableAnimation whether the app needs to animate stuff
 * @param {object} uniforms01 Uniforms object to be used in fragments, u_resolution/u_mouse/u_time got updated here
 * @param {object} uniforms02 Uniforms object to be used in fragments, u_resolution/u_mouse/u_time got updated here
 * @param {object} composer Threejs EffectComposer instance
 * @returns a custom threejs app instance that has the basic setup ready that can be further acted upon/customized
 */
export const runApp = (
  app,
  scene,
  renderer,
  camera,
  enableAnimation = false,
  uniforms = getDefaultUniforms(),
  uniforms02 = getDefaultUniforms(),
  composer = null
) => {
  // Create the HTML container, styles defined in index.html
  const container = document.getElementById("webGl-container");
  container.appendChild(renderer.domElement);

  // Register resize listener
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    // update uniforms.u_resolution
    if (uniforms.u_resolution !== undefined) {
      uniforms.u_resolution.value.x =
        window.innerWidth * window.devicePixelRatio;
      uniforms.u_resolution.value.y =
        window.innerHeight * window.devicePixelRatio;
    }
    if (uniforms02.u_resolution !== undefined) {
      uniforms02.u_resolution.value.x =
        window.innerWidth * window.devicePixelRatio;
        uniforms02.u_resolution.value.y =
        window.innerHeight * window.devicePixelRatio;
    }
  });

  // Define your app
  if (app.updateScene === undefined) {
    app.updateScene = (delta, elapsed) => {};
  }
  Object.assign(app, { ...app, container });

  // The engine that powers your scene into movement
  const clock = new THREE.Clock();
  const animate = () => {
    if (enableAnimation) {
      requestAnimationFrame(animate);
    }

    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();
    uniforms.u_time.value = elapsed;
    uniforms02.u_time.value = elapsed;

    app.updateScene(delta, elapsed);

    if (composer === null) {
      renderer.render(scene, camera);
    } else {
      renderer.clear();
      composer.render();
    }

  };

  app.initScene().then(animate)
};

/**
 * This creates the renderer, by default calls renderer's setPixelRatio and setSize methods
 * further reading on color management: See https://www.donmccurdy.com/2020/06/17/color-management-in-threejs/
 * @param {object} rendererProps props fed to WebGlRenderer constructor
 * @param {function} configureRenderer custom function for consumer to tune the renderer, takes renderer as the only parameter
 * @returns created renderer
 */
export const createRenderer = (
  rendererProps = {},
  configureRenderer = (renderer) => {}
) => {
  const renderer = new THREE.WebGLRenderer(rendererProps);
  renderer.gammaOutput = true;
  renderer.gammaFactor = 2.2
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // more configurations to the renderer from the consumer
  configureRenderer(renderer);

  return renderer;
};

/**
 * This function creates the EffectComposer object for post processing
 * @param {object} renderer The threejs renderer
 * @param {object} scene The threejs scene
 * @param {object} camera The threejs camera
 * @param {function} extraPasses custom function that takes takes composer as the only parameter, for the consumer to add custom passes
 * @returns The created composer object used for post processing
 */
export const createComposer = (renderer, scene, camera) => {
  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
  bloomPass.threshold = 0.08;
  bloomPass.strength = 0.9;
  bloomPass.radius = 0.1;

  const outputPass = new OutputPass( THREE.ReinhardToneMapping );

  const blurPass = new ShaderPass({
    uniforms: {
      "tDiffuse": { value: null },
      "resolution":   { value: new THREE.Vector2(window.innerWidth, window.innerHeight).multiplyScalar( window.devicePixelRatio ) },
      "blurSize": { value: 20.0 }
    },
    vertexShader: 
    `varying vec2 v_uv;
    
    void main() {
      v_uv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,
    fragmentShader: 
   `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float blurSize;

    varying vec2 v_uv;

    vec4 blur(sampler2D tex){
      const float PI2 = 6.28318530718; // Pi*2
    
      // BLUR SETTINGS {{{
      const float directions = 1.1; // BLUR DIRECTIONS (Default 16.0 - More is better but slower)
      const float quality = 10.0; // BLUR QUALITY (Default 3.0 - More is better but slower)
      // BLUR SETTINGS }}}
   
      vec2 radius = blurSize/resolution;
    
      // Normalized pixel coordinates (from 0 to 1)
      vec2 uv = gl_FragCoord.xy/resolution;
      // Pixel colour
      vec4 color = texture2D(tex, uv);
    
      // Blur calculations
      int count = 1;
      for( float theta=0.0; theta<PI2; theta+=PI2/directions)
      {
        vec2 dir = vec2(cos(theta), sin(theta)) * radius;
		    for(float i=1.0/quality; i<=1.0; i+=1.0/quality)
        {
			    color += texture2D( tex, uv+dir*i);	
          count++;
        }
      }
    
      color /= float(count);
      
      return color;
    }
    
    void main (void)
    {
      gl_FragColor = blur(tDiffuse); 
    }`
  }
 );
 blurPass.renderToScreen = true;



  let composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);
  // composer.addPass(blurPass);
  composer.addPass(outputPass);

  // custom passes that the consumer wants to add

  return composer;
};

/**
 * This function creates the three.js camera
 * @param {number} fov Field of view, def = 45
 * @param {number} near nearest distance of camera render range
 * @param {number} far furthest distance of camera render range
 * @param {object} camPos {x,y,z} of camera position
 * @param {object} camLookAt {x,y,z} where camera's looking at
 * @param {number} aspect Aspect ratio of camera, def = screen aspect
 * @returns the created camera object
 */
export const createCamera = (
  fov = 75,
  near = 0.1,
  far = 100,
  camPos = { x: 0, y: 0, z: 5 },
  camLookAt = { x: 0, y: 0, z: 0 },
  aspect = window.innerWidth / window.innerHeight
) => {
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(camPos.x, camPos.y, camPos.z);
  camera.lookAt(camLookAt.x, camLookAt.y, camLookAt.z); // this only works when there's no OrbitControls
  camera.updateProjectionMatrix();
  return camera;
};
