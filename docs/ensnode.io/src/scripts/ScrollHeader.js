export default function ScrollHeader() {
    if (typeof window !== 'undefined') {
        const header = document.getElementById('site-header');
        const elems = document.getElementsByClassName('test_scroll'); //TODO: fix it so that icons change color on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                header?.classList.add('scrolled');
                for (let elem of elems){
                    elem?.classList.add('scrolled');
                }
            } else {
                header?.classList.remove('scrolled');
                for (let elem of elems){
                    elem?.classList.remove('scrolled');
                }
            }
        });
    }
    return null;
}