import React, { SFC, Children, ReactElement, ComponentType } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    withStyles,
    createStyles,
    Theme,
    WithStyles,
} from '@material-ui/core/styles';
import { ReferenceFieldController, Identifier } from 'ra-core';

import LinearProgress from '../layout/LinearProgress';
import Link from '../Link';
import sanitizeRestProps from './sanitizeRestProps';
import { FieldProps, InjectedFieldProps, fieldPropTypes } from './types';

const styles = (theme: Theme) =>
    createStyles({
        link: {
            color: theme.palette.primary.main,
        },
    });

interface ChildProps {
    className: string;
    resource: string;
    id: Identifier;
    record?: any;
    allowEmpty: boolean;
    basePath: string;
    translateChoice: boolean;
}

interface Props extends FieldProps {
    allowEmpty: boolean;
    children: ReactElement<ChildProps>;
    reference: string;
    source: string;
    translateChoice: boolean;
    linkType: string | boolean;
}

interface InjectedProps extends InjectedFieldProps {
    data?: any;
    id: Identifier;
    isLoading?: boolean;
    resourceLinkPath?: string;
    resource: string;
    referenceRecord: any;
}

// useful to prevent click bubbling in a datagrid with rowClick
const stopPropagation = e => e.stopPropagation();

export const ReferenceFieldView: SFC<
    Props & InjectedProps & WithStyles<typeof styles>
> = ({
    allowEmpty,
    basePath,
    children,
    className,
    classes,
    isLoading,
    record,
    reference,
    referenceRecord,
    resource,
    resourceLinkPath,
    source,
    translateChoice = false,
    ...rest
}) => {
    if (isLoading) {
        return <LinearProgress />;
    }

    if (resourceLinkPath) {
        return (
            <Link
                to={resourceLinkPath}
                className={className}
                onClick={stopPropagation}
            >
                {React.cloneElement<ChildProps>(Children.only(children), {
                    className: classnames(
                        Children.only(children).props.className,
                        classes.link // force color override for Typography components
                    ),
                    record: referenceRecord,
                    resource: reference,
                    allowEmpty,
                    basePath,
                    translateChoice,
                    ...sanitizeRestProps(rest),
                })}
            </Link>
        );
    }

    return React.cloneElement(Children.only(children), {
        record: referenceRecord,
        resource: reference,
        allowEmpty,
        basePath,
        translateChoice,
        ...sanitizeRestProps(rest),
    });
};

/**
 * Fetch reference record, and delegate rendering to child component.
 *
 * The reference prop sould be the name of one of the <Resource> components
 * added as <Admin> child.
 *
 * @example
 * <ReferenceField label="User" source="userId" reference="users">
 *     <TextField source="name" />
 * </ReferenceField>
 *
 * By default, includes a link to the <Edit> page of the related record
 * (`/users/:userId` in the previous example).
 *
 * Set the linkType prop to "show" to link to the <Show> page instead.
 *
 * @example
 * <ReferenceField label="User" source="userId" reference="users" linkType="show">
 *     <TextField source="name" />
 * </ReferenceField>
 *
 * You can also prevent `<ReferenceField>` from adding link to children by setting
 * `linkType` to false.
 *
 * @example
 * <ReferenceField label="User" source="userId" reference="users" linkType={false}>
 *     <TextField source="name" />
 * </ReferenceField>
 */
const ReferenceField: SFC<
    Props & InjectedProps & WithStyles<typeof styles>
> = ({ children, ...props }) => {
    if (React.Children.count(children) !== 1) {
        throw new Error('<ReferenceField> only accepts a single child');
    }

    return (
        <ReferenceFieldController {...props}>
            {controllerProps => (
                <ReferenceFieldView
                    {...props}
                    {...{ children, ...controllerProps }}
                />
            )}
        </ReferenceFieldController>
    );
};

const EnhancedReferenceField = withStyles(styles)(
    ReferenceField
) as ComponentType<Props>;

EnhancedReferenceField.defaultProps = {
    addLabel: true,
    allowEmpty: false,
    linkType: 'edit',
};

EnhancedReferenceField.propTypes = {
    ...fieldPropTypes,
    allowEmpty: PropTypes.bool.isRequired,
    children: PropTypes.element.isRequired,
    reference: PropTypes.string.isRequired,
    translateChoice: PropTypes.bool,
    linkType: PropTypes.oneOfType([PropTypes.string, PropTypes.bool])
        .isRequired,
};

export default EnhancedReferenceField;
