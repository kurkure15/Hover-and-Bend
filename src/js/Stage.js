import { TweenMax as TM } from 'gsap/all'
import Scrollbar from 'smooth-scrollbar'
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll'
import Scene from './Scene'
import HorizontalScrollPlugin from './utils/HorizontalScrollPlugin'

Scrollbar.use(HorizontalScrollPlugin, OverscrollPlugin)

export default class Stage {
    constructor() {
        this.$els = {
            scene: document.getElementById('scene'),
        }
        this.init()
    }

    init() {
        this.Scroll = Scrollbar.init(document.querySelector('.scrollarea'), {
            delegateTo: document,
            continuousScrolling : false,
            overscrollEffect: 'bounce',
            damping: 0.05,
            plugins: {
                horizontalScroll: {
                    events: [/wheel/],
                },
            },
        })

        this.Scroll.track.xAxis.element.remove()
        this.Scroll.track.yAxis.element.remove()
        Scrollbar.detachStyle()
        this.scene = new Scene(this.$els.scene)
    }
}
