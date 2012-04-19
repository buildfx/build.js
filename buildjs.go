package main

import (
	"flag"
	"fmt"
	"github.com/buildfx/build.fx"
	"io/ioutil"
	"regexp"
	"strings"
)

const defaultRootSourceFile = "core.js"
const defaultOutputFile = "app.js"

func showWelcome() {
	for _, val := range []string{
		"Build.js",
		"A fast build system for large-scale JavaScript projects.",
		"(c) 2012, Joubert Nel",
	} {
		fmt.Println(val)
	}
}

func main() {
	showWelcome()

	var sourceFile string
	var outputFile string
	var dependRegexPattern string
	var propertyFiles string

	flag.StringVar(&sourceFile, "source", defaultRootSourceFile, "name of root JavaScript file")
	flag.StringVar(&outputFile, "out", defaultOutputFile, "name of output file")
	flag.StringVar(&dependRegexPattern, "depend-pattern", buildfx.DefaultDependRegexPattern, "regular expression for determining dependencies")
	flag.StringVar(&propertyFiles, "propfiles", "", "comma-separated list of property files")
	flag.Parse()

	if dependRegex, err := regexp.Compile(dependRegexPattern); err != nil {
		fmt.Println(err)
	} else {
		var sourceGraph = make(buildfx.SourceGraph)

		// First make a map of properties/values (if applicable) that must be applied to the sourceGraph
		var propertyValues = buildfx.MakePropertyMap(strings.Split(propertyFiles, ","), dependRegex)

		buildfx.MakeSourceGraphWithPropertyValues(sourceFile, dependRegex, sourceGraph, propertyValues)
		var buffer = buildfx.Serialize(sourceFile, sourceGraph)

		fmt.Println("Saving " + outputFile)
		if err := ioutil.WriteFile(outputFile, buffer.Bytes(), 0644); err != nil {
			fmt.Println(err)
		}
	}
}
