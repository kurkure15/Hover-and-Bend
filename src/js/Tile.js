import * as THREE from 'three'
import { gsap } from 'gsap'
import Scrollbar from 'smooth-scrollbar'
import vertexShader from '../glsl/vertexShader.glsl'

import { clamp, getRatio, wrap, ev } from './utils/utils'

export default class Tile {

    constructor($el, scene, duration, fragmentShader) {
        this.scene = scene
        this.$els = {
            body: document.body,
            el: $el,
            link: $el.querySelector('a'),
            text: [],
            title: '',
        }

        this.duration = duration

        this.mainImage = this.$els.el.querySelector('img')
        this.images = []
        this.sizes = new THREE.Vector2(0, 0)
        this.offset = new THREE.Vector2(0, 0)

        this.vertexShader = vertexShader
        this.fragmentShader = fragmentShader

        this.clock = new THREE.Clock()

        this.mouse = new THREE.Vector2(0, 0)

        this.scroll = 0
        this.prevScroll = 0
        this.delta = 0
        this.hasClicked = false
        this.isZoomed = false

        this.loader = new THREE.TextureLoader()
        this.preload([this.mainImage.src, '/dist/img/shape.jpg'], () => { this.initTile() })

        this.Scroll = Scrollbar.get(document.querySelector('.scrollarea'))

        this.bindEvent()
    }

    bindEvent() {
        document.addEventListener('tile:zoom', ({ detail }) => { this.zoom(detail) })


        window.addEventListener('resize', () => { this.onResize() })
        window.addEventListener('mousemove', (e) => { this.onMouseMove(e) })

        this.$els.link.addEventListener('mouseenter', () => { this.onPointerEnter() })
        this.$els.link.addEventListener('mouseleave', () => { this.onPointerLeave() })
        this.$els.link.addEventListener('click', (e) => { this.onClick(e) })

        this.Scroll.addListener((s) => { this.onScroll(s) })
    }

    /* Handlers
    --------------------------------------------------------- */

    onClick(e) {
        e.preventDefault()

        if (APP.Layout.isMobile) return

        if (!this.mesh) return

        this.hasClicked = true

        ev('toggleDetail', {
            open: true,
            target: this,
        })
    }

    onPointerEnter() {
        this.isHovering = true

        if (APP.Layout.isMobile) return

        const idx = clamp([...this.$els.el.parentElement.children].indexOf(this.$els.el) + 1, 1, 5)

        document.documentElement.style.setProperty('--color-bg', `var(--color-bg${idx})`)
        document.documentElement.style.setProperty('--color-text', `var(--color-text${idx})`)

        if (!this.mesh) return

        gsap.to(this.uniforms.u_progressHover, this.duration, {
            value: 1,
            ease: 'power2.easeInOut',
        })
    }

    onPointerLeave() {
        if (!this.mesh || APP.Layout.isMobile) return

        gsap.to(this.uniforms.u_progressHover, this.duration, {
            value: 0,
            ease: 'power2.easeInOut',
            onComplete: () => {
                this.isHovering = false
            },
        })
    }

    onResize() {
        this.getBounds()

        if (!this.mesh) return

        // Set mesh scale to match image aspect ratio
        const aspect = this.mainImage.naturalWidth / this.mainImage.naturalHeight
        if (aspect >= 1) {
            this.mesh.scale.set(aspect, 1, 1)
        } else {
            this.mesh.scale.set(1, 1 / aspect, 1)
        }

        this.uniforms.u_res.value.set(window.innerWidth, window.innerHeight)
    }

    onScroll({ offset, limit }) {
        this.scroll = offset.x / limit.x
    }

    onMouseMove(event) {
        // Remove the conditions that disable mouse tracking when clicked/zoomed
        if (APP.Layout.isMobile) return

        gsap.to(this.mouse, 0.5, {
            x: event.clientX,
            y: event.clientY,
        })
    }


    /* Actions
    --------------------------------------------------------- */

    initTile() {
        const texture = this.images[0]

        this.getBounds()

        // Calculate initial ratio properly
        const initialRatio = getRatio(this.sizes, this.images[0].image)

        this.uniforms = {
            u_alpha: { value: 1 },
            u_map: { type: 't', value: texture },
            u_shape: { value: this.images[2] },
            u_mouse: { value: this.mouse },
            u_progressHover: { value: 0 },
            u_progressClick: { value: 0 },
            u_time: { value: this.clock.getElapsedTime() },
            u_res: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            u_ratio: { value: initialRatio },
        }

        this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            transparent: true,
            defines: {
                PI: Math.PI,
                PR: window.devicePixelRatio.toFixed(1),
            },
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)

        this.mesh.position.x = this.offset.x
        this.mesh.position.y = this.offset.y

        // Set mesh scale to match image aspect ratio
        const aspect = this.mainImage.naturalWidth / this.mainImage.naturalHeight
        if (aspect >= 1) {
            this.mesh.scale.set(aspect, 1, 1)
        } else {
            this.mesh.scale.set(1, 1 / aspect, 1)
        }

        this.scene.mainScene.add(this.mesh)

        this.mainImage.classList.add('is-loaded')
    }

    move() {
        if (!this.mesh || this.isZoomed || this.hasClicked) return
        this.getBounds()

        gsap.set(this.mesh.position, {
            x: this.offset.x,
            y: this.offset.y,
        })

        gsap.to(this.mesh.scale, 0.3, {
            x: this.sizes.x - this.delta,
            y: this.sizes.y - this.delta,
            z: 1,
        })
    }

    update() {
        this.delta = Math.abs((this.scroll - this.prevScroll) * 2000)

        if (!this.mesh) return

        this.move()

        this.prevScroll = this.scroll

        // Allow time updates even when not hovering for continuous animation
        this.uniforms.u_time.value += this.clock.getDelta()
    }

    zoom({ tile, open }) {
        const shouldZoom = tile === this

        const newScl = {
            x: shouldZoom ? window.innerWidth * 0.44 : this.sizes.x,
            y: shouldZoom ? window.innerHeight - 140 : this.sizes.y,
        }

        const newPos = {
            x: shouldZoom ? window.innerWidth / 2 - window.innerWidth * 0.05 - this.sizes.x * 0.95 : this.offset.x,
            y: shouldZoom ? -20 : this.offset.y,
        }

        const newRatio = getRatio(newScl, this.images[0].image)

        const delay = shouldZoom ? 0.5 : 0

        this.hide(!shouldZoom, !open)

        gsap.to(this.uniforms.u_progressClick, 1.2, {
            value: shouldZoom ? 1 : 0,
            ease: 'power2.easeInOut',
            onComplete: () => {
                this.isZoomed = shouldZoom
                this.hasClicked = open

                ev('view:toggle', { shouldOpen: shouldZoom, target: this })
            },
        })

        gsap.to(this.mesh.scale, 1.2, {
            delay,
            x: newScl.x,
            y: newScl.y,
            ease: 'expo.easeInOut',
            onUpdate: () => { this.getBounds() },
        })

        gsap.to(this.mesh.position, 1.2, {
            delay,
            x: newPos.x,
            y: newPos.y,
            ease: 'expo.easeInOut',
        })

        gsap.to(this.uniforms.u_ratio.value, 1.2, {
            delay,
            x: newRatio.x,
            y: newRatio.y,
            ease: 'expo.easeInOut',
        })
    }


    hide(shouldHide, force) {
        const delay = shouldHide && !force ? 0 : 1.2
        gsap.to(this.uniforms.u_alpha, 0.5, {
            delay,
            value: shouldHide && !force ? 0 : 1,
            ease: 'power3.easeIn',
        })

        gsap.to(this.$els.el, 0.5, {
            delay,
            alpha: shouldHide && !force ? 0 : 1,
            force3D: true,
        })
    }


    /* Values
    --------------------------------------------------------- */

    getBounds() {
        const { width, height, left, top } = this.mainImage.getBoundingClientRect()

        if (!this.sizes.equals(new THREE.Vector2(width, height))) {
            this.sizes.set(width, height)
        }

        if (!this.offset.equals(new THREE.Vector2(left - window.innerWidth / 2 + width / 2, -top + window.innerHeight / 2 - height / 2))) {
            this.offset.set(left - window.innerWidth / 2 + width / 2, -top + window.innerHeight / 2 - height / 2)
        }
    }

    preload($els, allImagesLoadedCallback) {
        let loadedCounter = 0
        const toBeLoadedNumber = $els.length
        const preloadImage = ($el, anImageLoadedCallback) => {
            const image = this.loader.load($el, anImageLoadedCallback)
            image.center.set(0.5, 0.5)
            this.images.push(image)
        }

        $els.forEach(($el) => {
            preloadImage($el, () => {
                loadedCounter += 1
                if (loadedCounter === toBeLoadedNumber) {
                    allImagesLoadedCallback()
                }
            })
        })
    }

}

