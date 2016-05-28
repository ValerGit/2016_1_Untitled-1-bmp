define(function(require) {
  var View = require('views/base');

  var template = require('templates/user');

  var UserLoginView = require('views/user-login');
  var UserSignupView = require('views/user-signup');
  var UserOfflineView = require('views/user-offline');

  var UserView = View.Page.extend({
    events: {
      'click .js-tab-link': 'onTabLinkClick'
    },

    initialize: function() {
      this.template = template;

      this.tabs = {
        login:  {
          view: new UserLoginView(),
          title: 'Вход'
        },
        signup: {
          view: new UserSignupView(),
          title: 'Регистрация'
        },
        offline: {
          view: new UserOfflineView(),
          title: 'Офлайн'
        }
      };

      this.returnPage = '';
    },

    setReturnPage: function(page) {
      this.returnPage = page;
    },

    returnToPage: function() {
      var router = require('router');
      router.go(this.returnPage);
      this.returnPage = '';
    },

    onTabLinkClick: function(e) {
      var $link = $(e.target);
      this.tab($link.data('tab'));

      return false;
    },

    tab: function(tab) {
      if(this.tabs[tab] === undefined || this.activeTab === tab) {
        return;
      }

      this.$el.find('.js-tab-active, .js-tab-link-active')
        .removeClass('js-tab-active js-tab-link-active page-user__tab-menu-el_active page-user__tab_active');

      _.each(this.tabs, function(tab) {
        tab.view.hide();
      });

      this.$el.find('.js-tab[data-tab="' + tab + '"]')
        .addClass('js-tab-active page-user__tab_active');
      this.$el.find('.js-tab-link[data-tab="' + tab + '"]')
        .addClass('js-tab-link-active page-user__tab-menu-el_active');
      this.tabs[tab].view.show();

      this.activeTab = tab;

      var router = require('router');
      router.goSilent('user/' + tab);
    },

    render: function() {
      var html = this.template({
        tabs: _.map(this.tabs, function(tab, key) {
          return { title: tab.title, key: key };
        })
      });
      this.$el.html(html);

      _.each(this.tabs, function(tab, key) {
        this.$el.find('.js-tab[data-tab="' + key + '"]').append(tab.view.$el);
      }.bind(this));
    },

    show: function(loader) {
      if(!this.isRendered) {
        this.render();
        this.tab(_.keys(this.tabs).shift());
        this.isRendered = true;
      }

      if(!this.isShown) {
        loader(function(cb) {
          this.trigger('show');
          this.$el.show();
          cb();
        }.bind(this));
        this.isShown = true;
      }
    },

    hide: function() {
      this.$el.hide();
      this.isShown = false;
    },

    showUserPanel: function() {
      return false;
    },

    onAuth: function(result) {
      _.each(this.tabs, function(tab) {
        if(tab.view !== undefined && typeof tab.view.onAuth === 'function') {
          tab.view.onAuth(result, this);
        }
      }, this);
    }
  });

  return UserView;
});
