package buildfx

import (
	"path/filepath"
	"reflect"
	"regexp"
	"testing"
)

func TestFilepathJoin(t *testing.T) {
	var pathActual = filepath.Join(filepath.Dir("test_data/core.js"), "../test_data/util.js")
	var pathExpect = "test_data/util.js"

	if pathActual != pathExpect {
		t.Errorf("Got: %v\nExp: %v", pathActual, pathExpect)
	}

	pathActual = filepath.Join(filepath.Dir("testdata/core.js"), "../testdata/util.js")
	pathExpect = "testdata/util.js"

	if pathActual != pathExpect {
		t.Errorf("Got: %v\nExp: %v", pathActual, pathExpect)
	}
}

func TestResolveRelativePath(t *testing.T) {
	var result = []string{
		ResolveRelativePath("lib/core.js", "preamble.js"),
		ResolveRelativePath("lib/core.js", "controllers/reflex.js"),
		ResolveRelativePath("lib/controllers/reflex.js", "../views/mutationView.js"),
		ResolveRelativePath("lib/core.js", "../lib/preamble.js"),
		ResolveRelativePath("lib/core.js", "util/view/progressive/animated/flying/delayedView.js"),
	}

	var expectation = []string{
		"lib/preamble.js",
		"lib/controllers/reflex.js",
		"lib/views/mutationView.js",
		"lib/preamble.js",
		"lib/util/view/progressive/animated/flying/delayedView.js",
	}

	if !reflect.DeepEqual(result, expectation) {
		t.Errorf("\nGot: %v.\nExpected: %v", result, expectation)
	}
}

func TestGetDep(t *testing.T) {
	var source = []byte("// @depend sumer.js\n // @depend lib/luca.js\n// @depend blah.js")
	var regex, _ = regexp.Compile(DefaultDependRegexPattern)
	var expectation = []string{"sumer.js", "lib/luca.js", "blah.js"}

	if result := GetDeps(source, regex); !reflect.DeepEqual(expectation, result) {
		t.Errorf("\nGot: %v.\nExpected: %v", result, expectation)
	}
}

func TestMakePropertyMap(t *testing.T) {
	var propertyFiles = []string{"testdata/properties/app.properties", "testdata/properties/en.properties"}
	var dependRegex, _ = regexp.Compile(DefaultDependRegexPattern)
	var propertyMap = MakePropertyMap(propertyFiles, dependRegex)
	var expectation = PropertyValues{
		"VIEW.ASPECTRATIO": "19/6",
		"APP.VERSION":      "0.1",
		"TEXT.WELCOME":     "Welcome to Caprica; robot safehouse",
	}

	if !reflect.DeepEqual(propertyMap, expectation) {
		t.Errorf("\nGot: \n%v \nExpected: \n%v", propertyMap, expectation)
	}
}

func TestApplyPropertyValues(t *testing.T) {
	var data = "Welcome to Pacifica version $APP.VERSION$. It runs in $VIEWS.ASPECTRATIO.DESCRIPTION$."
	var propertyValues = map[string]string{
		"APP.VERSION":                   "0.1",
		"VIEWS.ASPECTRATIO.DESCRIPTION": "anamorphic widescreen",
	}

	var actual = string(ApplyPropertyValues([]byte(data), propertyValues))
	var expected = "Welcome to Pacifica version 0.1. It runs in anamorphic widescreen."

	if expected != actual {
		t.Errorf("Got: %V\nExpected: %v", actual, expected)
	}
}

func TestMakeSourceGraph(t *testing.T) {
	var sourceGraph = make(SourceGraph)
	var dependRegex, _ = regexp.Compile(DefaultDependRegexPattern)
	var expectation = map[string][]string{
		"testdata/core.js":                []string{"testdata/preamble.js", "testdata/lib/util/functional.js", "testdata/lib/grandcentral.js"},
		"testdata/preamble.js":            nil,
		"testdata/lib/grandcentral.js":    []string{"testdata/lib/preamble.js"},
		"testdata/lib/preamble.js":        nil,
		"testdata/lib/util/functional.js": []string{"testdata/lib/grandcentral.js"},
	}

	MakeSourceGraph("testdata/core.js", dependRegex, sourceGraph)

	for _, sourceFile := range sourceGraph {
		if !reflect.DeepEqual(expectation[sourceFile.filepath], sourceFile.deps) {
			t.Errorf("\nGot: %v.\nExpected: %v", sourceFile.deps, expectation[sourceFile.filepath])
		}
	}
}

func TestMakeSourceGraphWithPropertyValues(t *testing.T) {
	var sourceGraph = make(SourceGraph)
	var dependRegex, _ = regexp.Compile(DefaultDependRegexPattern)
	var propertyValues = PropertyValues{
		"RESOLUTION": "1080",
		"APPNAME":    "Gulfstream",
	}

	MakeSourceGraphWithPropertyValues("testdata_with_propertyvalues/core.js", dependRegex, sourceGraph, propertyValues)

	var expected_core_js_data = "// @depend views_1080p.js"
	var actual_core_js_data = string(sourceGraph["testdata_with_propertyvalues/core.js"].data)
	if expected_core_js_data != actual_core_js_data {
		t.Errorf("Got: %v\nExpected: %v", actual_core_js_data, expected_core_js_data)
	}

	var expected_views_1080p_js_data = "console.log('Gulfstream 1080p views loaded');"
	var actual_views_1080p_js_data = string(sourceGraph["testdata_with_propertyvalues/views_1080p.js"].data)
	if expected_views_1080p_js_data != actual_views_1080p_js_data {
		t.Errorf("Got: %v\nExpected: %v", actual_views_1080p_js_data, expected_views_1080p_js_data)
	}

}

func TestMakeBuildOrder(t *testing.T) {
	var sourceGraph = make(SourceGraph)
	var regex, _ = regexp.Compile(DefaultDependRegexPattern)
	var expectation = []string{
		"testdata/preamble.js",
		"testdata/lib/preamble.js",
		"testdata/lib/grandcentral.js",
		"testdata/lib/util/functional.js",
		"testdata/core.js",
	}
	var actual = []string{}

	MakeSourceGraph("testdata/core.js", regex, sourceGraph)
	var serializationOrder = MakeBuildOrder("testdata/core.js", sourceGraph)

	for filepath := serializationOrder.Front(); filepath != nil; filepath = filepath.Next() {
		actual = append(actual, filepath.Value.(string))
	}

	if !reflect.DeepEqual(expectation, actual) {
		t.Errorf("\nGot: %v.\nExpected: %v", actual, expectation)
	}
}

func TestSerialize(t *testing.T) {
	var sourceGraph = make(SourceGraph)
	var regex, _ = regexp.Compile(DefaultDependRegexPattern)
	MakeSourceGraph("testdata/lib/util/functional.js", regex, sourceGraph)

	var buffer = Serialize("testdata/lib/util/functional.js", sourceGraph)
	var text = buffer.String()
	var expectation = "\n\n// Included by buildfx. File: testdata/lib/preamble.js\n" +
		"// this is testdata/lib/preamble.js" +
		"\n\n// Included by buildfx. File: testdata/lib/grandcentral.js\n" +
		"// this is testdata/lib/grandcentral.js\n\n" +
		"// @depend preamble.js" +
		"\n\n// Included by buildfx. File: testdata/lib/util/functional.js\n" +
		"// this is testdata/lib/util/functional.js\n\n" +
		"// @depend ../grandcentral.js"

	if text != expectation {
		t.Errorf("Got:\n%v\n\nExpected:\n%v", text, expectation)
	}
}
