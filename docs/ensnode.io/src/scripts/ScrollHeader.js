export default function ScrollHeader() {
    if (typeof window !== 'undefined') {
        const header = document.getElementById('site-header');
        const defaultImage = document.getElementsByClassName('defaultImage')[0];
        const onScrollImage = document.getElementsByClassName('onScrollImage')[0];
        const headerButtons = document.getElementsByClassName('onScrollElement');

        const scrollWatcher = document.createElement("div");

        scrollWatcher.setAttribute("data-scroll-watcher", "");
        header.before(scrollWatcher);

        const navObserver = new IntersectionObserver(
            (entries) => {
                header.classList.toggle("scrolled", !entries[0].isIntersecting);
                defaultImage.classList.toggle("scrolled", !entries[0].isIntersecting);
                onScrollImage.classList.toggle("scrolled", !entries[0].isIntersecting);

                for (const headerButton of headerButtons) {
                    headerButton.classList.toggle("scrolled", !entries[0].isIntersecting);
                }
            },
            {rootMargin: "100px 0px 0px 0px"}
        );

        navObserver.observe(scrollWatcher);
    }

    return null;
}
