'use strict';

describe('Editor.Menu', function () {
  function getTemplate () {
    return [
      {
        label: 'foo',
        submenu: [
        ],
      },

      {
        label: 'bar',
        submenu: [
          {
            label: 'bar.01',
          },
          {
            label: 'bar.02',
          },
        ],
      },
    ];
  }

  it('should be built from template', done => {
    let testMenu = new Editor.Menu(getTemplate());

    expect( testMenu.nativeMenu.items.length ).to.equal(2);
    expect( testMenu.nativeMenu.items[0].label ).to.equal('foo');

    done();
  });

  it('should be able to add menu item through template', done => {
    let testMenu = new Editor.Menu();
    testMenu.add('foo/bar', getTemplate());

    expect( testMenu.nativeMenu.items[0].label ).to.equal('foo');
    expect( testMenu.nativeMenu.items[0].submenu.items[0].label ).to.equal('bar');

    done();
  });

  it('should be able to add menu item by path', done => {
    let testMenu = new Editor.Menu();
    testMenu.add('tar/zom', {message: 'hint'});

    expect( testMenu.nativeMenu.items[0].label ).to.equal('tar');
    expect( testMenu.nativeMenu.items[0].submenu.items[0].label ).to.equal('zom');

    done();
  });

  it('should be able to add menu template array as submenu by path', done => {
    let testMenu = new Editor.Menu();
    testMenu.add('foo/bar', [
      { label: 'a', message: 'a' },
      { label: 'b', message: 'b' },
      { label: 'c', message: 'c' },
    ]);

    let items = testMenu.nativeMenu.items[0].submenu.items[0].submenu.items;
    expect(items.length).to.equal(3);
    expect(items[0].label).to.equal('a');
    expect(items[1].label).to.equal('b');
    expect(items[2].label).to.equal('c');

    done();
  });

  it('should be able to expand menu template if it contains path field', done => {
    let testMenu = new Editor.Menu();
    testMenu.add('foo/bar', [
      { path: 'foobar/a', message: 'a' },
      { path: 'foobar/b', message: 'b' },
      { path: 'foobar/c', message: 'c' },
    ]);

    let foobarItem = testMenu.nativeMenu
      .items[0].submenu
      .items[0].submenu
      .items[0]
      ;

    expect(foobarItem.label).to.equal('foobar');
    expect(foobarItem.submenu.items[0].label).to.equal('a');
    expect(foobarItem.submenu.items[1].label).to.equal('b');
    expect(foobarItem.submenu.items[2].label).to.equal('c');

    done();
  });

  it('should be able to remove menu item by path', done => {
    let testMenu = new Editor.Menu(getTemplate());
    expect( testMenu.nativeMenu.items[1].submenu.items.length ).to.equal(2);

    testMenu.remove('bar/bar.01');
    expect( testMenu.nativeMenu.items[1].submenu.items.length ).to.equal(1);

    done();
  });

  it('should be able to update exists sub-menu at root', done => {
    let tmpl = [
      {
        label: 'foo',
        submenu: [
          {
            label: 'foo.01',
          },
          {
            label: 'foo.02',
          },
        ],
      },

      {
        label: 'bar',
        submenu: [
          {
            label: 'bar.01',
          },
          {
            label: 'bar.02',
          },
        ],
      },
    ];

    let testMenu = new Editor.Menu(tmpl);
    testMenu.update( 'foo', [
      {
        label: 'foo.01.new',
      },
      {
        label: 'foo.02.new',
      },
      {
        label: 'foo.03.new',
      },
    ]);

    expect( testMenu.nativeMenu.items[0].submenu.items[0].label ).to.equal('foo.01.new');
    expect( testMenu.nativeMenu.items[0].submenu.items[1].label ).to.equal('foo.02.new');
    expect( testMenu.nativeMenu.items[0].submenu.items[2].label ).to.equal('foo.03.new');
    expect( testMenu.nativeMenu.items[1].label ).to.equal('bar');

    done();
  });

  it('should be able to update exists sub-menu at path', done => {
    let tmpl = [
      {
        label: 'foo',
        submenu: [
          {
            label: 'foo.01',
            submenu: [
              {
                label: 'foo.01.a',
              },
              {
                label: 'foo.01.b',
              },
            ]
          },
          {
            label: 'foo.02',
          },
        ],
      },

      {
        label: 'bar',
        submenu: [
          {
            label: 'bar.01',
          },
          {
            label: 'bar.02',
          },
        ],
      },
    ];

    let testMenu = new Editor.Menu(tmpl);
    testMenu.update( 'foo/foo.01', [
      {
        label: 'foo.01.a.new',
      },
      {
        label: 'foo.01.b.new',
      },
      {
        label: 'foo.01.c.new',
      },
    ]);

    let fooFoo01 = testMenu.nativeMenu.items[0].submenu.items[0];
    expect( fooFoo01.submenu.items[0].label ).to.equal('foo.01.a.new');
    expect( fooFoo01.submenu.items[1].label ).to.equal('foo.01.b.new');
    expect( fooFoo01.submenu.items[2].label ).to.equal('foo.01.c.new');
    expect( testMenu.nativeMenu.items[0].submenu.items[1].label ).to.equal('foo.02');

    done();
  });

  it('should not add dev template in release mode', done => {
    let oldDev = Editor.Menu.showDev;
    Editor.Menu.showDev = false;

    let tmpl = [
      {
        label: 'foo',
        submenu: [
        ],
        dev: true,
      },

      {
        label: 'bar',
        submenu: [
          {
            label: 'bar.01',
            dev: true,
          },
          {
            label: 'bar.02',
          },
        ],
      },
    ];

    let testMenu = new Editor.Menu(tmpl);

    expect( testMenu.nativeMenu.items.length ).to.equal(1);
    expect( testMenu.nativeMenu.items[0].submenu.items[0].label ).to.equal('bar.02');

    Editor.Menu.showDev = oldDev;
    done();
  });

  it('should be able to parse template with path', done => {
    let tmpl = [
      { label: 'foo', type: 'submenu', submenu: [] },
      { label: 'bar', type: 'submenu', submenu: [] },
      { path: 'foo/foo.01', },
      { path: 'bar/bar.01', },
      { path: 'bar/bar.02', type: 'submenu', submenu: [] },
      { path: 'foobar/say hello', click: () => { console.log('hello world'); } },
      { label: 'a menu item', click: () => { console.log('a menu item'); } },
      { path: 'bar/bar.02/bar.02.01' },
      { path: 'a menu path item', click: () => { console.log('a menu item'); } },
    ];

    let testMenu = new Editor.Menu(tmpl);

    // basic
    expect( testMenu.nativeMenu.items[0].submenu.items[0].label ).to.equal('foo.01');
    expect( testMenu.nativeMenu.items[1].submenu.items[0].label ).to.equal('bar.01');
    expect( testMenu.nativeMenu.items[1].submenu.items[1].label ).to.equal('bar.02');

    // test if path can add in order
    expect( testMenu.nativeMenu.items[2].label ).to.equal('foobar');
    expect( testMenu.nativeMenu.items[3].label ).to.equal('a menu item');

    // test if first level path can be add correctly
    expect( testMenu.nativeMenu.items[4].label ).to.equal('a menu path item');

    // test if second level path can be add correctly
    expect( testMenu.nativeMenu.items[1].submenu.items[1].submenu.items[0].label )
    .to.equal('bar.02.01');

    done();
  });

});
