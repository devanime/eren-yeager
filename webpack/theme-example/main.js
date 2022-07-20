import Vue from 'vue';
import 'estarossa.common';
import 'estarossa.directives.toggle';
import 'estarossa.video';
import 'estarossa.tag-manager';

const importAll = (r) => r.keys().map(r).map((m) => m.default);
importAll(require.context('../images', true));
importAll(require.context('../fonts', true));

const components = importAll(require.context('./components', false, /.vue$/));
components.forEach((c) => Vue.component(c.name, c));

jQuery.ajaxSetup({
    beforeSend: function(xhr) {
        xhr.setRequestHeader('X-WP-Nonce', sit.nonce);
    }
});

new Vue({
}).$mount('#app');
