package buildfx

import (
	"bytes"
	"container/list"
	"fmt"
	"io/ioutil"
	"path/filepath"
	"regexp"
	"strings"
)

type SourceFile struct {
	filepath string
	data     []byte
	deps     []string
}

type SourceGraph map[string]SourceFile
type PropertyValues map[string]string

const (
	DefaultDependRegexPattern = "@dep[end]*\\s(?P<filepath>[a-zA-Z./_0-9]+)"
	regexFilepathGroupIndex   = 1

	propertyValuePattern            = "(?P<propertyname>[a-zA-Z.]+)[\\s]*=[\\s]*(?P<propertyvalue>[[:graph:] ]+)"
	regexPropertyNameGroupIndex     = 1
	regexPropertyValueGroupIndex    = 2
	propertyNamePartPattern         = "\\$[a-zA-Z.]+\\$"
	propertyNamePartNamedGroupIndex = 1
)

var (
	dependRegex              regexp.Regexp
	propertyValueRegex, _    = regexp.Compile(propertyValuePattern)
	propertyNamePartRegex, _ = regexp.Compile(propertyNamePartPattern)
)

func ResolveRelativePath(startingPath, relativePath string) string {
	var dir = filepath.Dir(startingPath)
	return filepath.Join(dir, relativePath)
}

func GetDeps(data []byte, dependRegex *regexp.Regexp) []string {
	var deps = []string{}
	for _, m := range dependRegex.FindAllStringSubmatch(string(data), -1) {
		deps = append(deps, m[regexFilepathGroupIndex])
	}
	return deps
}

func ApplyPropertyValues(data []byte, propertyValues PropertyValues) []byte {
	return []byte(propertyNamePartRegex.ReplaceAllStringFunc(string(data), func(match string) string {
		var propertyName = strings.Trim(match, "$")
		return propertyValues[propertyName]
	}))
}

func MakePropertyMap(propertyFiles []string, dependRegex *regexp.Regexp) PropertyValues {
	var propertyValues = make(PropertyValues, 1)

	var addPropertyValuesFromBufferToMap = func(buffer bytes.Buffer, theMap *PropertyValues) {
		for _, propVal := range propertyValueRegex.FindAllStringSubmatch(buffer.String(), -1) {
			var propertyName = propVal[regexPropertyNameGroupIndex]
			var propertyValue = propVal[regexPropertyValueGroupIndex]
			propertyValues[propertyName] = propertyValue
		}
	}

	for _, propFile := range propertyFiles {
		var propGraph = make(SourceGraph)
		MakeSourceGraph(propFile, dependRegex, propGraph)
		addPropertyValuesFromBufferToMap(Serialize(propFile, propGraph), &propertyValues)
	}

	return propertyValues
}

func MakeSourceGraph(path string, dependRegex *regexp.Regexp, graph SourceGraph) {
	var propertyValues = PropertyValues{}
	MakeSourceGraphWithPropertyValues(path, dependRegex, graph, propertyValues)
}

func MakeSourceGraphWithPropertyValues(path string, dependRegex *regexp.Regexp, graph SourceGraph, propertyValues PropertyValues) {
	if _, isInGraph := graph[path]; !isInGraph {
		var fileBytes, err = ioutil.ReadFile(path)

		if err != nil {
			fmt.Println(err)
		} else {
			fmt.Println("Adding to source graph: ", path)
			fileBytes = ApplyPropertyValues(fileBytes, propertyValues)

			var dependencies []string

			for _, d := range GetDeps(fileBytes, dependRegex) {
				dependencies = append(dependencies, ResolveRelativePath(path, d))
			}

			graph[path] = SourceFile{
				filepath: path,
				data:     fileBytes,
				deps:     dependencies,
			}

			for _, dependentPath := range graph[path].deps {
				MakeSourceGraphWithPropertyValues(dependentPath, dependRegex, graph, propertyValues)
			}
		}
	}
}

func MakeBuildOrder(sourceFile string, graph SourceGraph) *list.List {
	var helper func(sourceFile string, graph SourceGraph) *list.List
	var pathsAlreadyInList = make(map[string]bool)

	var pushBackUnique = func(theList *list.List, path string) {
		if !pathsAlreadyInList[path] {
			theList.PushBack(path)
			pathsAlreadyInList[path] = true
		}
	}

	helper = func(sourceFile string, graph SourceGraph) *list.List {
		var fileList = list.New()

		for _, path := range graph[sourceFile].deps {
			if deps := graph[path].deps; len(deps) == 0 {
				pushBackUnique(fileList, path)
			} else {
				fileList.PushBackList(helper(path, graph))
			}
		}
		pushBackUnique(fileList, sourceFile)
		return fileList
	}

	return helper(sourceFile, graph)
}

func Serialize(sourceFile string, graph SourceGraph) bytes.Buffer {
	var buffer bytes.Buffer
	var serializationOrder = MakeBuildOrder(sourceFile, graph)

	fmt.Println("Calculating serialization order.")
	fmt.Println("# files: ", serializationOrder.Len())

	for filePath := serializationOrder.Front(); filePath != nil; filePath = filePath.Next() {
		var sourceFile = graph[filePath.Value.(string)]
		buffer.WriteString("\n\n// Included by buildfx. File: " + sourceFile.filepath + "\n")
		buffer.Write(sourceFile.data)
	}

	return buffer
}
