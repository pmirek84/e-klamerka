import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Cozy colour grade: gentle saturation lift, warm highlights, soft vignette. Runs in linear space before tone mapping.
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uNight: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uNight; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(.2126, .7152, .0722));
      c.rgb = mix(vec3(l), c.rgb, 1.16 - uNight * .12);
      c.rgb *= mix(vec3(1.03, 1.0, .96), vec3(.97, 1.0, 1.08), uNight);
      vec2 d = vUv - .5; float v = 1.0 - dot(d, d) * (.55 + uNight * .25);
      c.rgb *= v;
      gl_FragColor = c;
    }`,
};

export function createPost(renderer, scene, camera, quality) {
  if (quality === 'low') return null;
  const size = renderer.getSize(new T.Vector2());
  const target = new T.WebGLRenderTarget(size.x, size.y, { type: T.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new T.Vector2(size.x / 2, size.y / 2), .32, .55, .92);
  composer.addPass(bloom);
  const grade = new ShaderPass(GradeShader); composer.addPass(grade);
  composer.addPass(new OutputPass());
  return {
    render(night) { grade.uniforms.uNight.value = night; bloom.strength = .28 + night * .45; composer.render(); },
    setSize(w, h, ratio) { composer.setPixelRatio(ratio); composer.setSize(w, h); },
    dispose() { composer.dispose(); target.dispose(); },
  };
}
