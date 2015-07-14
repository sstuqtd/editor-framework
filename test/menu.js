
describe('Editor.Menu', function() {
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

    it('should be built from template', function( done ) {
        var testMenu = new Editor.Menu(getTemplate());

        expect( testMenu.nativeMenu.items.length ).to.equal(2);
        expect( testMenu.nativeMenu.items[0].label ).to.equal('foo');

        done();
    });

    it('should add menu item through template', function( done ) {
        var testMenu = new Editor.Menu();
        testMenu.add('foo/bar', getTemplate());

        expect( testMenu.nativeMenu.items[0].label ).to.equal('foo');

        done();
    });

});

describe('Editor.MainMenu', function() {

    var MainMenu = Editor.MainMenu;
    var addmenu;
    before(function() {
        addmenu = sinon.stub(Editor.Menu.prototype, 'add');
    });
    after(function() {
        addmenu.restore();
    });

    describe('.add', function() {
        it('should add path and label', function() {
            MainMenu.add('foo/bar', {
                'label': 'zoo',
                'message': 'hint'
            });
            expect( addmenu.firstCall.args[0] ).to.equal('foo/bar');
            expect( addmenu.firstCall.args[1] ).to.deep.equal({
                'label': 'zoo',
                'message': 'hint'
            });
        });
        it('should add path without label', function() {
            MainMenu.add('foo/bar/zom', {
                'message': 'hint'
            });
            expect( addmenu.secondCall.args[0] ).to.equal('foo/bar');
            expect( addmenu.secondCall.args[1] ).to.deep.equal({
                'label': 'zom',
                'message': 'hint'
            });
        });
    });

})
